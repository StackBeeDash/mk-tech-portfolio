/**
 * RBAC（Role-Based Access Control）ポリシー実装
 *
 * Admin / Manager / User の 3 ロール構成によるアクセス制御。
 * JWT クレームの app_role を基に、エンドポイントへのアクセスを制御する。
 *
 * Why この設計にしたか:
 * - ロール階層を定義し、「manager 以上」のような指定を可能にする
 * - リソースベースの権限定義で、きめ細かいアクセス制御を実現
 * - ミドルウェアとして Hono のルーティングに自然に組み込める
 */

import type { Context, MiddlewareHandler } from "hono";
import type { AuthUser } from "../middleware/auth.js";

// --- Types ---

/** アプリケーションのロール */
export type AppRole = "admin" | "manager" | "user";

/** リソースに対する操作 */
export type Action = "create" | "read" | "update" | "delete" | "export";

/** リソースの種類 */
export type Resource =
  | "users"
  | "items"
  | "tenants"
  | "audit-logs"
  | "api-keys"
  | "webhooks";

/** 権限定義 */
export interface Permission {
  resource: Resource;
  action: Action;
  /** 自分のデータのみか、テナント全体か */
  scope: "own" | "tenant" | "global";
}

// --- Role Hierarchy ---

/** ロール階層（上位ロールは下位ロールの権限を包含） */
const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin: 3,
  manager: 2,
  user: 1,
};

/**
 * ロールが指定レベル以上かを判定
 */
export function hasMinimumRole(
  userRole: AppRole,
  requiredRole: AppRole,
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// --- Permission Definitions ---

/**
 * ロール別の権限定義
 *
 * 各ロールが持つ固有の権限を定義。上位ロールは下位ロールの権限を自動的に継承する。
 */
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  user: [
    { resource: "items", action: "create", scope: "own" },
    { resource: "items", action: "read", scope: "own" },
    { resource: "items", action: "update", scope: "own" },
    { resource: "items", action: "delete", scope: "own" },
    { resource: "users", action: "read", scope: "own" },
    { resource: "users", action: "update", scope: "own" },
  ],
  manager: [
    { resource: "items", action: "read", scope: "tenant" },
    { resource: "items", action: "update", scope: "tenant" },
    { resource: "items", action: "delete", scope: "tenant" },
    { resource: "items", action: "export", scope: "tenant" },
    { resource: "users", action: "read", scope: "tenant" },
    { resource: "users", action: "create", scope: "tenant" }, // 招待
    { resource: "audit-logs", action: "read", scope: "tenant" },
    { resource: "webhooks", action: "create", scope: "tenant" },
    { resource: "webhooks", action: "read", scope: "tenant" },
    { resource: "webhooks", action: "update", scope: "tenant" },
    { resource: "webhooks", action: "delete", scope: "tenant" },
    { resource: "tenants", action: "update", scope: "tenant" },
  ],
  admin: [
    { resource: "items", action: "read", scope: "global" },
    { resource: "items", action: "update", scope: "global" },
    { resource: "items", action: "delete", scope: "global" },
    { resource: "users", action: "read", scope: "global" },
    { resource: "users", action: "create", scope: "global" },
    { resource: "users", action: "update", scope: "global" },
    { resource: "users", action: "delete", scope: "global" },
    { resource: "tenants", action: "create", scope: "global" },
    { resource: "tenants", action: "read", scope: "global" },
    { resource: "tenants", action: "update", scope: "global" },
    { resource: "audit-logs", action: "read", scope: "global" },
    { resource: "api-keys", action: "create", scope: "global" },
    { resource: "api-keys", action: "read", scope: "global" },
    { resource: "api-keys", action: "delete", scope: "global" },
  ],
};

/**
 * ロールの全権限を取得（階層を考慮して継承分を含む）
 */
export function getPermissions(role: AppRole): Permission[] {
  const permissions: Permission[] = [];
  const roleLevel = ROLE_HIERARCHY[role];

  for (const [r, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if (ROLE_HIERARCHY[r as AppRole] <= roleLevel) {
      permissions.push(...perms);
    }
  }

  return permissions;
}

/**
 * 特定のリソース・アクションに対する権限があるか判定
 */
export function checkPermission(
  role: AppRole,
  resource: Resource,
  action: Action,
  scope?: "own" | "tenant" | "global",
): boolean {
  const permissions = getPermissions(role);

  return permissions.some((p) => {
    if (p.resource !== resource || p.action !== action) return false;
    if (!scope) return true;

    // global > tenant > own の順でスコープが広い
    const scopeLevel = { own: 1, tenant: 2, global: 3 };
    return scopeLevel[p.scope] >= scopeLevel[scope];
  });
}

// --- Middleware ---

/**
 * 最小ロールを要求するミドルウェア
 *
 * @example
 * ```typescript
 * // manager 以上のロールが必要
 * app.get('/api/team/members', requireRole('manager'), handler);
 * ```
 */
export function requireRole(minimumRole: AppRole): MiddlewareHandler {
  return async (c: Context, next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!hasMinimumRole(user.role, minimumRole)) {
      return c.json(
        {
          error: "Forbidden",
          message: `This action requires ${minimumRole} role or higher`,
          required: minimumRole,
          current: user.role,
        },
        403,
      );
    }

    await next();
  };
}

/**
 * リソース・アクションベースの権限チェックミドルウェア
 *
 * @example
 * ```typescript
 * // items リソースの export 権限が必要
 * app.get('/api/items/export', requirePermission('items', 'export'), handler);
 * ```
 */
export function requirePermission(
  resource: Resource,
  action: Action,
): MiddlewareHandler {
  return async (c: Context, next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!checkPermission(user.role, resource, action)) {
      return c.json(
        {
          error: "Forbidden",
          message: `No permission for ${action} on ${resource}`,
          resource,
          action,
        },
        403,
      );
    }

    await next();
  };
}
