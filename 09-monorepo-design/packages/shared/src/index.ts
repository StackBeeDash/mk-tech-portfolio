/**
 * @monorepo-demo/shared
 *
 * モノレポ内の全パッケージで共有するユーティリティ・型定義。
 * apps/web と apps/api の両方からインポートされる。
 */

export { formatDate, truncate, generateId, sleep } from "./utils";
export type {
  User,
  ApiResponse,
  PaginatedResponse,
  HealthCheckResponse,
} from "./types";
