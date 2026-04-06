/**
 * レート制限ミドルウェア
 *
 * トークンバケットアルゴリズムとスライディングウィンドウの 2 つの方式を提供。
 * インメモリストレージを使用（本番では Redis に差し替え可能な設計）。
 *
 * Why この設計にしたか:
 * - トークンバケット: バースト許容が必要な一般 API 向け。実装がシンプルで CPU 負荷が低い
 * - スライディングウィンドウ: 認証エンドポイント等、厳密な制限が必要な箇所向け
 * - ストレージを抽象化し、インメモリ→Redis への移行を容易にする
 */

import type { Context, MiddlewareHandler } from "hono";

// --- Types ---

export interface RateLimitConfig {
  /** レート制限のキーを生成する関数（デフォルト: IP アドレス） */
  keyGenerator?: (c: Context) => string;
  /** レスポンスヘッダーにレート制限情報を含めるか */
  includeHeaders?: boolean;
}

export interface TokenBucketConfig extends RateLimitConfig {
  algorithm: "token-bucket";
  /** バケットの最大容量（バースト上限） */
  maxTokens: number;
  /** 1 秒あたりの補充トークン数 */
  refillRate: number;
}

export interface SlidingWindowConfig extends RateLimitConfig {
  algorithm: "sliding-window";
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
}

type RateLimiterConfig = TokenBucketConfig | SlidingWindowConfig;

// --- Token Bucket Store ---

interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

const tokenBucketStore = new Map<string, TokenBucketState>();

function consumeTokenBucket(
  key: string,
  maxTokens: number,
  refillRate: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let state = tokenBucketStore.get(key);

  if (!state) {
    state = { tokens: maxTokens, lastRefill: now };
    tokenBucketStore.set(key, state);
  }

  // トークンを補充
  const elapsed = (now - state.lastRefill) / 1000;
  state.tokens = Math.min(maxTokens, state.tokens + elapsed * refillRate);
  state.lastRefill = now;

  if (state.tokens >= 1) {
    state.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(state.tokens),
      resetAt: now + Math.ceil((maxTokens - state.tokens) / refillRate) * 1000,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: now + Math.ceil(1 / refillRate) * 1000,
  };
}

// --- Sliding Window Store ---

const slidingWindowStore = new Map<string, number[]>();

function consumeSlidingWindow(
  key: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let timestamps = slidingWindowStore.get(key);

  if (!timestamps) {
    timestamps = [];
    slidingWindowStore.set(key, timestamps);
  }

  // ウィンドウ外のタイムスタンプを除去
  const windowStart = now - windowMs;
  while (timestamps.length > 0 && timestamps[0] <= windowStart) {
    timestamps.shift();
  }

  if (timestamps.length < maxRequests) {
    timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
      resetAt:
        timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: timestamps[0] + windowMs,
  };
}

// --- Cleanup ---

/** 期限切れのエントリを定期的に削除（メモリリーク防止） */
const CLEANUP_INTERVAL_MS = 60_000;

setInterval(() => {
  const now = Date.now();

  // Token Bucket: 10 分以上アクセスのないエントリを削除
  for (const [key, state] of tokenBucketStore) {
    if (now - state.lastRefill > 600_000) {
      tokenBucketStore.delete(key);
    }
  }

  // Sliding Window: 空のエントリを削除
  for (const [key, timestamps] of slidingWindowStore) {
    if (timestamps.length === 0) {
      slidingWindowStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

// --- Default Key Generator ---

function defaultKeyGenerator(c: Context): string {
  // X-Forwarded-For ヘッダー（Cloud Run / LB 経由の場合）
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // フォールバック: リモートアドレス
  return c.req.header("X-Real-IP") ?? "unknown";
}

// --- Middleware ---

/**
 * レート制限ミドルウェアを生成する
 *
 * @example Token Bucket（一般 API 向け）
 * ```typescript
 * app.use('/api/*', rateLimiter({
 *   algorithm: 'token-bucket',
 *   maxTokens: 100,
 *   refillRate: 10,
 * }));
 * ```
 *
 * @example Sliding Window（認証エンドポイント向け）
 * ```typescript
 * app.use('/auth/*', rateLimiter({
 *   algorithm: 'sliding-window',
 *   windowMs: 60_000,
 *   maxRequests: 5,
 * }));
 * ```
 */
export function rateLimiter(config: RateLimiterConfig): MiddlewareHandler {
  const keyGenerator = config.keyGenerator ?? defaultKeyGenerator;
  const includeHeaders = config.includeHeaders ?? true;

  return async (c: Context, next) => {
    const key = keyGenerator(c);

    let result: { allowed: boolean; remaining: number; resetAt: number };

    if (config.algorithm === "token-bucket") {
      result = consumeTokenBucket(key, config.maxTokens, config.refillRate);
    } else {
      result = consumeSlidingWindow(key, config.windowMs, config.maxRequests);
    }

    // レスポンスヘッダーにレート制限情報を付与
    if (includeHeaders) {
      const limit =
        config.algorithm === "token-bucket"
          ? config.maxTokens
          : config.maxRequests;

      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(result.remaining));
      c.header(
        "X-RateLimit-Reset",
        String(Math.ceil(result.resetAt / 1000)),
      );
    }

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      c.header("Retry-After", String(Math.max(1, retryAfter)));

      return c.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.max(1, retryAfter),
        },
        429,
      );
    }

    await next();
  };
}
