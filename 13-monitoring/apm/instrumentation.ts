/**
 * APM 計装 - dd-trace による自動計装とカスタムスパン
 *
 * Why この設計にしたか:
 * - dd-trace の init() はアプリケーション起動の最初に呼ぶ必要がある（モンキーパッチ方式のため）
 * - ミドルウェアで自動計装しつつ、ビジネスロジックにはカスタムスパンを追加
 * - サービス間のトレース伝播は dd-trace が HTTP ヘッダ（x-datadog-*）を自動で処理
 */

import tracer from "dd-trace";

// ============================================================
// dd-trace 初期化（アプリケーション起動時に最初に実行）
// ============================================================

tracer.init({
  service: process.env.DD_SERVICE || "my-service",
  env: process.env.DD_ENV || "development",
  version: process.env.DD_VERSION || "0.0.0",
  logInjection: true, // ログにトレース情報を自動注入
  runtimeMetrics: true, // Node.js ランタイムメトリクス（GC, Event Loop）を収集
  profiling: true, // Continuous Profiler を有効化
  appsec: true, // Application Security Monitoring を有効化
  // サンプリングレート: 本番では 0.1〜0.5 程度に設定しコストを制御
  // 開発環境では 1.0（全トレース取得）
  sampleRate: process.env.DD_ENV === "production" ? 0.2 : 1.0,
});

export { tracer };

// ============================================================
// Hono ミドルウェア - 自動計装
// ============================================================

import type { Context, Next } from "hono";

/**
 * Hono 用 Datadog APM ミドルウェア
 *
 * dd-trace は Express/Koa を自動検出するが、Hono は手動で計装する必要がある。
 * このミドルウェアでリクエストごとにスパンを作成し、メタデータを付与する。
 */
export function datadogMiddleware() {
  return async (c: Context, next: Next): Promise<void> => {
    const span = tracer.startSpan("http.request", {
      type: "web",
      tags: {
        "http.method": c.req.method,
        "http.url": c.req.url,
        "http.route": c.req.routePath || c.req.path,
        "span.kind": "server",
      },
    });

    // リクエスト ID をスパンに付与（トレースとログの紐付けに利用）
    const requestId =
      c.req.header("x-request-id") || crypto.randomUUID();
    span.setTag("request_id", requestId);
    c.set("requestId", requestId);

    // スパンをコンテキストに設定（下流で参照可能にする）
    c.set("ddSpan", span);

    try {
      await tracer.scope().activate(span, async () => {
        await next();
      });

      // レスポンス情報をスパンに記録
      span.setTag("http.status_code", c.res.status);

      if (c.res.status >= 500) {
        span.setTag("error", true);
        span.setTag("error.type", "ServerError");
      }
    } catch (error) {
      // エラー情報をスパンに記録
      span.setTag("error", true);

      if (error instanceof Error) {
        span.setTag("error.message", error.message);
        span.setTag("error.stack", error.stack || "");
        span.setTag("error.type", error.name);
      }

      throw error;
    } finally {
      span.finish();
    }
  };
}

// ============================================================
// Express ミドルウェア - 自動計装
// ============================================================

import type { Request, Response, NextFunction } from "express";

/**
 * Express 用 Datadog APM ミドルウェア
 *
 * dd-trace は Express を自動検出して計装するが、
 * カスタムタグ（request_id, user_id）を付与するためにミドルウェアを追加する。
 */
export function datadogExpressMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const span = tracer.scope().active();

    if (span) {
      const requestId =
        (req.headers["x-request-id"] as string) || crypto.randomUUID();

      span.setTag("request_id", requestId);
      // user_id は認証ミドルウェアの後で設定される想定
      // span.setTag("usr.id", req.user?.id);

      res.setHeader("x-request-id", requestId);
    }

    next();
  };
}

// ============================================================
// カスタムスパンの作成例
// ============================================================

/**
 * ビジネスロジックにカスタムスパンを追加する例
 *
 * Why: APM の自動計装は HTTP/DB 層のみ。ビジネスロジック内の
 * 処理時間を可視化するにはカスタムスパンが必要。
 */
export async function processOrder(orderId: string): Promise<void> {
  // 親スパン: 注文処理全体
  await tracer.trace(
    "order.process",
    {
      resource: `order:${orderId}`,
      tags: {
        "order.id": orderId,
        "span.kind": "internal",
      },
    },
    async (span) => {
      // 子スパン 1: 在庫確認
      await tracer.trace("order.check_inventory", async (childSpan) => {
        childSpan?.setTag("order.id", orderId);
        // 在庫確認ロジック（ダミー）
        await simulateWork(50);
      });

      // 子スパン 2: 決済処理
      await tracer.trace("order.process_payment", async (childSpan) => {
        childSpan?.setTag("order.id", orderId);
        childSpan?.setTag("payment.method", "credit_card");
        // 決済処理ロジック（ダミー）
        await simulateWork(200);
      });

      // 子スパン 3: 通知送信
      await tracer.trace("order.send_notification", async (childSpan) => {
        childSpan?.setTag("order.id", orderId);
        childSpan?.setTag("notification.type", "email");
        // 通知送信ロジック（ダミー）
        await simulateWork(30);
      });

      span?.setTag("order.status", "completed");
    },
  );
}

// ============================================================
// サービス間トレース伝播の例
// ============================================================

/**
 * 外部サービスへのリクエストにトレースコンテキストを伝播する例
 *
 * dd-trace は fetch/http モジュールを自動計装するため、
 * 通常は明示的な伝播コードは不要。ここでは仕組みを示すために明示的に記述。
 */
export async function callExternalService(
  url: string,
  payload: unknown,
): Promise<Response> {
  const span = tracer.startSpan("external.service.call", {
    tags: {
      "span.kind": "client",
      "http.url": url,
      "http.method": "POST",
    },
  });

  // トレースコンテキストをヘッダに注入
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  tracer.inject(span, "http_headers", headers);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    span.setTag("http.status_code", response.status);

    if (!response.ok) {
      span.setTag("error", true);
      span.setTag("error.message", `HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    span.setTag("error", true);
    if (error instanceof Error) {
      span.setTag("error.message", error.message);
    }
    throw error;
  } finally {
    span.finish();
  }
}

// ============================================================
// ヘルパー
// ============================================================

function simulateWork(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
