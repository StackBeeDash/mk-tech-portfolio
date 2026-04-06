/**
 * カスタムメトリクス送信 - DogStatsD クライアント
 *
 * Why この設計にしたか:
 * - DogStatsD（UDP）はアプリケーションのパフォーマンスに影響を与えない（Fire-and-forget）
 * - hot-shots ライブラリは DogStatsD プロトコルの Node.js 実装として最も広く使われている
 * - ビジネスメトリクスを Datadog に送ることで、技術指標とビジネス指標を同一ダッシュボードで分析可能
 * - タグを活用してメトリクスの次元（サービス、環境、エンドポイント）を柔軟に分析
 */

import StatsD from "hot-shots";

// ============================================================
// DogStatsD クライアント設定
// ============================================================

const statsd = new StatsD({
  host: process.env.DD_AGENT_HOST || "localhost",
  port: 8125,
  prefix: "app.", // 全メトリクスに "app." プレフィックスを付与
  globalTags: {
    service: process.env.DD_SERVICE || "my-service",
    env: process.env.DD_ENV || "development",
    version: process.env.DD_VERSION || "0.0.0",
  },
  // エラーハンドリング: DogStatsD の送信失敗でアプリケーションをクラッシュさせない
  errorHandler(error: Error) {
    console.error("[DogStatsD] Error:", error.message);
  },
  // バッファリング: 複数メトリクスをまとめて送信しネットワーク効率を向上
  maxBufferSize: 100,
  bufferFlushInterval: 1000, // 1秒ごとにフラッシュ
});

export { statsd };

// ============================================================
// ビジネスメトリクス
// ============================================================

/**
 * 注文完了メトリクス
 *
 * メトリクス種別: INCREMENT (カウンター)
 * 用途: 単位時間あたりの注文数をトラッキング
 */
export function trackOrderCompleted(params: {
  orderId: string;
  amount: number;
  paymentMethod: string;
  region: string;
}): void {
  // 注文数カウント
  statsd.increment("orders.completed", 1, {
    payment_method: params.paymentMethod,
    region: params.region,
  });

  // 注文金額（Distribution Metrics で集約）
  statsd.distribution("orders.amount", params.amount, {
    payment_method: params.paymentMethod,
    region: params.region,
  });
}

/**
 * ユーザーアクティビティメトリクス
 *
 * メトリクス種別: GAUGE（現在値）
 * 用途: アクティブユーザー数のリアルタイム監視
 */
export function trackActiveUsers(count: number): void {
  statsd.gauge("users.active", count);
}

/**
 * API 利用量メトリクス
 *
 * メトリクス種別: INCREMENT (カウンター)
 * 用途: API エンドポイントごとの利用量把握、レートリミット設計の根拠
 */
export function trackApiRequest(params: {
  endpoint: string;
  method: string;
  statusCode: number;
  tenantId: string;
}): void {
  statsd.increment("api.requests.total", 1, {
    endpoint: params.endpoint,
    method: params.method,
    status_code: String(params.statusCode),
    tenant_id: params.tenantId,
  });
}

// ============================================================
// パフォーマンスメトリクス
// ============================================================

/**
 * キャッシュヒット率メトリクス
 *
 * メトリクス種別: INCREMENT (カウンター) - hit/miss をそれぞれカウント
 * 用途: キャッシュ効率の監視。ヒット率低下はパフォーマンス劣化の兆候
 *
 * ダッシュボードでの計算式:
 *   hit_rate = cache.hit / (cache.hit + cache.miss) * 100
 */
export function trackCacheHit(params: {
  cacheType: "redis" | "memory" | "cdn";
  hit: boolean;
  key?: string;
}): void {
  const metric = params.hit ? "cache.hit" : "cache.miss";
  statsd.increment(metric, 1, {
    cache_type: params.cacheType,
  });
}

/**
 * DB クエリ時間メトリクス
 *
 * メトリクス種別: DISTRIBUTION（パーセンタイル自動計算）
 * 用途: スロークエリの検出、P50/P95/P99 の監視
 *
 * Why Distribution を使うか:
 * - Histogram と異なり、サーバーサイドで集約されるためホスト間の正確なパーセンタイルが得られる
 * - Metrics without Limits で不要なタグを後から除外可能
 */
export function trackDbQueryDuration(params: {
  operation: "select" | "insert" | "update" | "delete";
  table: string;
  durationMs: number;
}): void {
  statsd.distribution("db.query.duration", params.durationMs, {
    operation: params.operation,
    table: params.table,
  });

  // スロークエリの検出（100ms 以上）
  if (params.durationMs > 100) {
    statsd.increment("db.query.slow", 1, {
      operation: params.operation,
      table: params.table,
    });
  }
}

/**
 * 外部 API レスポンスタイムメトリクス
 */
export function trackExternalApiDuration(params: {
  service: string;
  endpoint: string;
  durationMs: number;
  success: boolean;
}): void {
  statsd.distribution("external_api.duration", params.durationMs, {
    external_service: params.service,
    endpoint: params.endpoint,
  });

  if (!params.success) {
    statsd.increment("external_api.errors", 1, {
      external_service: params.service,
      endpoint: params.endpoint,
    });
  }
}

// ============================================================
// ミドルウェア統合例
// ============================================================

import type { Context, Next } from "hono";

/**
 * Hono ミドルウェア: リクエストメトリクスの自動収集
 *
 * APM の自動計装とは別に、DogStatsD でカスタムメトリクスを送信する。
 * これにより APM を有効にしていない環境でもメトリクスを取得可能。
 */
export function metricsMiddleware() {
  return async (c: Context, next: Next): Promise<void> => {
    const start = performance.now();

    await next();

    const durationMs = performance.now() - start;
    const route = c.req.routePath || c.req.path;

    // リクエスト時間の Distribution
    statsd.distribution("http.request.duration", durationMs, {
      method: c.req.method,
      route,
      status_code: String(c.res.status),
    });

    // ステータスコード別カウント
    statsd.increment("http.request.count", 1, {
      method: c.req.method,
      route,
      status_code: String(c.res.status),
    });
  };
}

// ============================================================
// グレースフルシャットダウン
// ============================================================

/**
 * アプリケーション終了時にバッファをフラッシュ
 * メトリクスの欠落を防ぐために必ず呼び出す
 */
export function closeMetrics(): Promise<void> {
  return new Promise((resolve, reject) => {
    statsd.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
