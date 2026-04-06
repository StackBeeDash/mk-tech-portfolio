/**
 * 認証ミドルウェア
 *
 * Supabase Auth が発行する JWT を検証し、リクエストコンテキストにユーザー情報を設定する。
 * Hono フレームワーク向けのミドルウェアとして実装。
 *
 * Why この設計にしたか:
 * - JWKS エンドポイントから公開鍵を取得し、JWT の署名を検証する（シークレットのハードコード不要）
 * - キャッシュ付きの JWKS 取得で、リクエストごとの外部通信を削減
 * - Hono のミドルウェアパターンに準拠し、他のミドルウェアと組み合わせ可能
 */

import type { Context, MiddlewareHandler } from "hono";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// --- Types ---

/** Supabase Auth JWT のカスタムクレーム */
export interface AppMetadata {
  app_role: "admin" | "manager" | "user";
  tenant_id: string;
  provider?: string;
}

/** JWT のペイロード（Supabase Auth 拡張） */
export interface SupabaseJWTPayload extends JWTPayload {
  email?: string;
  app_metadata: AppMetadata;
  user_metadata?: Record<string, unknown>;
}

/** 認証済みユーザーのコンテキスト */
export interface AuthUser {
  id: string; // sub claim
  email: string | undefined;
  role: "admin" | "manager" | "user";
  tenantId: string;
}

// --- Configuration ---

export interface AuthConfig {
  /** Supabase プロジェクトの URL */
  supabaseUrl: string;
  /** JWT の想定される audience */
  audience?: string;
  /** 認証をスキップするパスの一覧 */
  publicPaths?: string[];
}

// --- JWKS Cache ---

/** JWKS の取得関数をキャッシュ */
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(supabaseUrl: string) {
  if (!jwksCache) {
    const jwksUrl = new URL(
      "/auth/v1/.well-known/jwks.json",
      supabaseUrl,
    );
    jwksCache = createRemoteJWKSet(jwksUrl);
  }
  return jwksCache;
}

// --- Middleware ---

/**
 * 認証ミドルウェアを生成する
 *
 * @example
 * ```typescript
 * const app = new Hono();
 *
 * app.use('/api/*', authMiddleware({
 *   supabaseUrl: process.env.SUPABASE_URL!,
 *   publicPaths: ['/health', '/api/public/webhook'],
 * }));
 * ```
 */
export function authMiddleware(config: AuthConfig): MiddlewareHandler {
  const { supabaseUrl, audience = "authenticated", publicPaths = [] } = config;

  return async (c: Context, next) => {
    // 公開パスはスキップ
    const path = new URL(c.req.url).pathname;
    if (publicPaths.some((p) => path.startsWith(p))) {
      await next();
      return;
    }

    // Authorization ヘッダーから Bearer トークンを取得
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json(
        { error: "Missing or invalid Authorization header" },
        401,
      );
    }

    const token = authHeader.slice(7); // "Bearer " の長さ分スキップ

    try {
      // JWT の署名検証 + クレーム検証
      const jwks = getJWKS(supabaseUrl);
      const { payload } = await jwtVerify(token, jwks, {
        audience,
        issuer: `${supabaseUrl}/auth/v1`,
      });

      const supabasePayload = payload as SupabaseJWTPayload;

      // app_metadata の存在チェック
      if (!supabasePayload.app_metadata?.tenant_id) {
        return c.json({ error: "Invalid token: missing tenant_id" }, 401);
      }

      if (!supabasePayload.app_metadata?.app_role) {
        return c.json({ error: "Invalid token: missing app_role" }, 401);
      }

      // 認証済みユーザー情報をコンテキストに設定
      const user: AuthUser = {
        id: supabasePayload.sub!,
        email: supabasePayload.email,
        role: supabasePayload.app_metadata.app_role,
        tenantId: supabasePayload.app_metadata.tenant_id,
      };

      c.set("user", user);
      await next();
    } catch (error) {
      if (error instanceof Error) {
        // JWT の有効期限切れ
        if (error.message.includes("exp")) {
          return c.json({ error: "Token expired" }, 401);
        }
        // その他の検証エラー
        return c.json(
          { error: "Invalid token", detail: error.message },
          401,
        );
      }
      return c.json({ error: "Authentication failed" }, 401);
    }
  };
}

/**
 * コンテキストから認証済みユーザーを取得するヘルパー
 *
 * @throws 認証ミドルウェアが適用されていない場合にエラー
 */
export function getAuthUser(c: Context): AuthUser {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) {
    throw new Error(
      "AuthUser not found in context. Ensure authMiddleware is applied.",
    );
  }
  return user;
}
