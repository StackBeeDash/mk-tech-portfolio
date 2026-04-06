/**
 * テナント分離ポリシー
 *
 * マルチテナント SaaS アプリケーションにおけるテナント間のデータ分離を
 * アプリケーション層で強制する。DB の RLS と合わせて二重チェックを行う。
 *
 * Why この設計にしたか:
 * - RLS だけに依存すると、Supabase サービスキー使用時やバッチ処理時にバイパスされるリスクがある
 * - アプリケーション層でもテナント ID を検証することで、Defense in Depth を実現
 * - リクエストパラメータでのテナント ID 上書き攻撃を防止
 */

import type { Context, MiddlewareHandler } from "hono";
import type { AuthUser } from "../middleware/auth.js";

// --- Types ---

/** テナントコンテキスト */
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: "admin" | "manager" | "user";
}

/** テナント分離の設定 */
export interface TenantIsolationConfig {
  /** admin ロールにテナント横断アクセスを許可するか */
  allowAdminCrossTenant?: boolean;
  /** テナント ID のヘッダー名（デバッグ用、本番では使用しない） */
  tenantHeaderName?: string;
}

// --- Middleware ---

/**
 * テナント分離ミドルウェア
 *
 * JWT のテナント ID をリクエストコンテキストに設定し、
 * 以降のハンドラーで一貫したテナント ID を使用させる。
 *
 * @example
 * ```typescript
 * app.use('/api/*', tenantIsolation({ allowAdminCrossTenant: true }));
 * ```
 */
export function tenantIsolation(
  config: TenantIsolationConfig = {},
): MiddlewareHandler {
  const { allowAdminCrossTenant = true } = config;

  return async (c: Context, next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // テナントコンテキストを設定
    const tenantCtx: TenantContext = {
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
    };

    c.set("tenant", tenantCtx);
    await next();
  };
}

/**
 * リクエストパラメータのテナント ID を検証するミドルウェア
 *
 * URL パラメータやリクエストボディに含まれるテナント ID が、
 * JWT のテナント ID と一致することを検証する。
 *
 * @example
 * ```typescript
 * app.get('/api/tenants/:tenantId/items', validateTenantAccess('tenantId'), handler);
 * ```
 */
export function validateTenantAccess(
  paramName: string = "tenantId",
): MiddlewareHandler {
  return async (c: Context, next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // URL パラメータからテナント ID を取得
    const requestedTenantId = c.req.param(paramName);

    if (!requestedTenantId) {
      return c.json(
        { error: `Missing required parameter: ${paramName}` },
        400,
      );
    }

    // admin はテナント横断アクセス可能
    if (user.role === "admin") {
      await next();
      return;
    }

    // 自テナント以外へのアクセスを拒否
    if (requestedTenantId !== user.tenantId) {
      return c.json(
        {
          error: "Forbidden",
          message: "Access denied: cross-tenant access is not allowed",
        },
        403,
      );
    }

    await next();
  };
}

// --- Helper Functions ---

/**
 * コンテキストからテナント情報を取得するヘルパー
 */
export function getTenantContext(c: Context): TenantContext {
  const tenant = c.get("tenant") as TenantContext | undefined;
  if (!tenant) {
    throw new Error(
      "TenantContext not found. Ensure tenantIsolation middleware is applied.",
    );
  }
  return tenant;
}

/**
 * Supabase クエリにテナントフィルターを適用するヘルパー
 *
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('items')
 *   .select('*')
 *   .eq('tenant_id', getTenantFilter(c));
 * ```
 */
export function getTenantFilter(c: Context): string {
  const tenant = getTenantContext(c);
  return tenant.tenantId;
}

/**
 * データがリクエスト元のテナントに属しているか検証
 */
export function assertTenantOwnership(
  c: Context,
  data: { tenant_id: string },
): void {
  const tenant = getTenantContext(c);

  // admin はテナント横断可能
  if (tenant.role === "admin") return;

  if (data.tenant_id !== tenant.tenantId) {
    throw new TenantAccessError(
      `Data belongs to tenant ${data.tenant_id}, but user belongs to ${tenant.tenantId}`,
    );
  }
}

/**
 * テナントアクセスエラー
 */
export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}
