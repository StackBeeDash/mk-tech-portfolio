/**
 * 共有型定義
 *
 * フロントエンド (web) とバックエンド (api) で共通して使用する型。
 * API のリクエスト/レスポンスの型を一元管理することで、
 * フロント・バック間の型の不整合を防ぐ。
 */

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API レスポンスの共通ラッパー型
 *
 * 成功時は data にペイロード、失敗時は error にエラー情報を格納。
 * フロントエンドで型安全にレスポンスをハンドリングできる。
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  timestamp: string;
}
