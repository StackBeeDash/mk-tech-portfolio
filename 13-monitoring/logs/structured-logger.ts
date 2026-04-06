/**
 * 構造化ログ実装 - Datadog ログパイプライン対応
 *
 * Why この設計にしたか:
 * - JSON 構造化ログにすることで、Datadog のログパイプラインでパース不要（JSON Auto-parse）
 * - dd.trace_id / dd.span_id を自動付与し、ログからトレースへのシームレスな遷移を実現
 * - pino を選択した理由: Node.js で最速の JSON ロガー。winston より 5-10x 高速
 * - リクエストコンテキスト（request_id, user_id, tenant_id）を自動付与し、
 *   ログ検索時のフィルタリングを容易にする
 */

import pino from "pino";
import tracer from "dd-trace";

// ============================================================
// ログレベル管理
// ============================================================

/**
 * ログレベルの使い分け:
 * - ERROR: 即座に対応が必要なエラー（500系、外部サービス障害）
 * - WARN:  注意が必要だが即時対応は不要（リトライ成功、非推奨 API 利用）
 * - INFO:  正常な業務イベント（注文完了、ユーザー登録）
 * - DEBUG: 開発・デバッグ用の詳細情報（本番では通常 OFF）
 */
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// ============================================================
// ベースロガー
// ============================================================

const baseLogger = pino({
  level: LOG_LEVEL,
  // Datadog が期待するフィールド名にマッピング
  formatters: {
    level(label: string) {
      // Datadog は "status" フィールドでログレベルを認識する
      return { status: label.toUpperCase() };
    },
    log(object: Record<string, unknown>) {
      // dd-trace のアクティブスパンからトレース情報を自動取得
      const span = tracer.scope().active();

      if (span) {
        const spanContext = span.context();
        return {
          ...object,
          // Datadog のログ-トレース連携に必要なフィールド
          dd: {
            trace_id: spanContext.toTraceId(),
            span_id: spanContext.toSpanId(),
            service: process.env.DD_SERVICE || "my-service",
            env: process.env.DD_ENV || "development",
            version: process.env.DD_VERSION || "0.0.0",
          },
        };
      }

      return {
        ...object,
        dd: {
          service: process.env.DD_SERVICE || "my-service",
          env: process.env.DD_ENV || "development",
          version: process.env.DD_VERSION || "0.0.0",
        },
      };
    },
  },
  // タイムスタンプを ISO 8601 形式で出力（Datadog の自動パース対応）
  timestamp: pino.stdTimeFunctions.isoTime,
  // メッセージキーを Datadog の期待する "message" に変更
  messageKey: "message",
});

export { baseLogger };

// ============================================================
// リクエストコンテキスト付きロガー
// ============================================================

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * リクエストごとにコンテキスト情報を付与したロガーを生成
 *
 * Why: ログ検索時に request_id でフィルタすれば、1 リクエストの全ログを追跡可能。
 * tenant_id でフィルタすれば、特定テナントの問題を調査可能。
 */
export function createRequestLogger(context: RequestContext): pino.Logger {
  return baseLogger.child({
    request_id: context.requestId,
    usr: {
      id: context.userId || "anonymous",
    },
    tenant_id: context.tenantId,
    http: {
      method: context.method,
      url: context.path,
      useragent: context.userAgent,
    },
    network: {
      client: {
        ip: context.ip,
      },
    },
  });
}

// ============================================================
// Hono ミドルウェア - ログコンテキスト自動付与
// ============================================================

import type { Context, Next } from "hono";

/**
 * Hono ミドルウェア: リクエストログの自動記録
 *
 * リクエスト開始・完了をログに記録し、下流のハンドラで使えるロガーをセット。
 */
export function loggingMiddleware() {
  return async (c: Context, next: Next): Promise<void> => {
    const requestId =
      c.req.header("x-request-id") || crypto.randomUUID();

    const logger = createRequestLogger({
      requestId,
      userId: c.get("userId"),
      tenantId: c.get("tenantId"),
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("user-agent"),
      ip: c.req.header("x-forwarded-for") || "unknown",
    });

    // ロガーをコンテキストに設定
    c.set("logger", logger);
    c.set("requestId", requestId);

    const start = performance.now();

    logger.info({
      event: "request.start",
      message: `${c.req.method} ${c.req.path}`,
    });

    try {
      await next();

      const durationMs = Math.round(performance.now() - start);

      logger.info({
        event: "request.complete",
        message: `${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms`,
        http: {
          status_code: c.res.status,
        },
        duration_ms: durationMs,
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);

      logger.error({
        event: "request.error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
        error: {
          kind: error instanceof Error ? error.name : "UnknownError",
          message:
            error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        duration_ms: durationMs,
      });

      throw error;
    }
  };
}

// ============================================================
// 構造化ログのユーティリティ
// ============================================================

/**
 * ビジネスイベントログ
 *
 * 業務上重要なイベントを構造化して記録。Datadog のログ分析で集計可能。
 */
export function logBusinessEvent(
  logger: pino.Logger,
  event: string,
  data: Record<string, unknown>,
): void {
  logger.info({
    event,
    ...data,
    message: `Business event: ${event}`,
  });
}

/**
 * 外部サービス呼び出しログ
 *
 * 外部 API の呼び出し結果を記録。障害時の原因特定に利用。
 */
export function logExternalCall(
  logger: pino.Logger,
  params: {
    service: string;
    operation: string;
    durationMs: number;
    success: boolean;
    statusCode?: number;
    errorMessage?: string;
  },
): void {
  const level = params.success ? "info" : "error";

  logger[level]({
    event: "external_call",
    external_service: params.service,
    operation: params.operation,
    duration_ms: params.durationMs,
    success: params.success,
    http: params.statusCode
      ? { status_code: params.statusCode }
      : undefined,
    error: params.errorMessage
      ? { message: params.errorMessage }
      : undefined,
    message: `External call: ${params.service}.${params.operation} ${params.success ? "succeeded" : "failed"} (${params.durationMs}ms)`,
  });
}

// ============================================================
// センシティブデータのサニタイズ
// ============================================================

/**
 * ログ出力前にセンシティブデータをマスクするユーティリティ
 *
 * Why: ログパイプライン側でもマスキングするが、多重防御としてアプリケーション層でもマスクする
 * （Defense in Depth）
 */
const SENSITIVE_PATTERNS: Array<{
  key: RegExp;
  replacer: (value: string) => string;
}> = [
  {
    key: /email/i,
    replacer: (v) => v.replace(/(.{2}).*(@.*)/, "$1***$2"),
  },
  {
    key: /phone/i,
    replacer: (v) => v.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
  },
  {
    key: /(password|secret|token|api_key|authorization)/i,
    replacer: () => "[REDACTED]",
  },
  {
    key: /credit_card|card_number/i,
    replacer: (v) => v.replace(/\d(?=\d{4})/g, "*"),
  },
];

export function sanitize(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      const pattern = SENSITIVE_PATTERNS.find((p) => p.key.test(key));
      sanitized[key] = pattern ? pattern.replacer(value) : value;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
