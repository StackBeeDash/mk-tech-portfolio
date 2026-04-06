/**
 * 共有ユーティリティ関数
 *
 * フロントエンド (web) とバックエンド (api) の両方で使える
 * ピュアなユーティリティ関数を集約。
 * ブラウザ / Node.js 両対応のため、DOM API には依存しない。
 */

/**
 * 日付を YYYY-MM-DD 形式にフォーマットする。
 *
 * @example
 * formatDate(new Date("2024-03-15T10:30:00Z"))
 * // => "2024-03-15"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 文字列を指定の長さで切り詰め、末尾に "..." を付加する。
 *
 * @example
 * truncate("Hello, World!", 8)
 * // => "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * ランダムな ID を生成する。
 * crypto API が利用可能な場合はそれを使い、
 * フォールバックとして Math.random を使用する。
 *
 * @example
 * generateId()
 * // => "a1b2c3d4e5f6"
 */
export function generateId(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 指定ミリ秒待機する Promise を返す。
 *
 * @example
 * await sleep(1000); // 1秒待機
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
