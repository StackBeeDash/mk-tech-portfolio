/**
 * テストデータ定義
 *
 * Why:
 * - テストデータを一箇所に集約し、テスト間の一貫性を保証
 * - ダミーデータは機密情報を含まない安全な値を使用
 * - 型定義により、テストデータの構造を明示
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestItem {
  name: string;
  description: string;
}

/** 認証用テストユーザー */
export const TEST_USERS = {
  /** 標準的な認証テスト用ユーザー */
  standard: {
    email: "demo-user@example.com",
    password: "Demo-P@ssw0rd-2024",
    name: "Demo User",
  } satisfies TestUser,

  /** 管理者権限テスト用ユーザー */
  admin: {
    email: "demo-admin@example.com",
    password: "Admin-P@ssw0rd-2024",
    name: "Demo Admin",
  } satisfies TestUser,

  /** 無効な認証情報（エラーケース用） */
  invalid: {
    email: "invalid@example.com",
    password: "wrong-password",
    name: "Invalid User",
  } satisfies TestUser,
} as const;

/** CRUD テスト用アイテムデータ */
export const TEST_ITEMS = {
  /** 新規作成テスト用 */
  create: {
    name: "テストアイテム_新規",
    description: "E2Eテストで自動作成されたアイテムです",
  } satisfies TestItem,

  /** 更新テスト用（更新前） */
  beforeUpdate: {
    name: "テストアイテム_更新前",
    description: "更新前の説明文です",
  } satisfies TestItem,

  /** 更新テスト用（更新後） */
  afterUpdate: {
    name: "テストアイテム_更新後",
    description: "更新後の説明文です",
  } satisfies TestItem,

  /** 削除テスト用 */
  delete: {
    name: "テストアイテム_削除対象",
    description: "このアイテムは削除テストで使われます",
  } satisfies TestItem,

  /** 検索テスト用 */
  search: {
    name: "ユニーク検索キーワードXYZ",
    description: "検索テスト用のアイテムです",
  } satisfies TestItem,
} as const;

/** アプリケーション URL パス */
export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  settings: "/settings",
  notFound: "/this-page-does-not-exist",
} as const;
