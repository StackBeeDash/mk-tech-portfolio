import { formatDate, truncate } from "@monorepo-demo/shared";
import type { HealthCheckResponse } from "@monorepo-demo/shared";

/**
 * トップページ
 *
 * shared パッケージのユーティリティ関数と型定義を使用して、
 * モノレポ内パッケージ間の連携をデモする。
 */
export default async function Page() {
  const now = new Date();
  const formattedDate = formatDate(now);
  const longText =
    "This is a demo of the Turborepo + pnpm monorepo architecture with shared packages.";
  const truncatedText = truncate(longText, 40);

  // API からヘルスチェック情報を取得（デモ用のフォールバック付き）
  let health: HealthCheckResponse = {
    status: "healthy",
    version: "0.1.0",
    uptime: 0,
    timestamp: now.toISOString(),
  };

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
    const res = await fetch(`${apiUrl}/health`, {
      cache: "no-store",
    });
    if (res.ok) {
      health = await res.json();
    }
  } catch {
    // API が起動していない場合はフォールバック値を使用
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem" }}>
      <h1>Monorepo Demo</h1>
      <p>Turborepo + pnpm workspace architecture</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Shared Package Demo</h2>
        <ul>
          <li>
            <strong>formatDate:</strong> {formattedDate}
          </li>
          <li>
            <strong>truncate:</strong> {truncatedText}
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>API Health</h2>
        <ul>
          <li>
            <strong>Status:</strong> {health.status}
          </li>
          <li>
            <strong>Version:</strong> {health.version}
          </li>
          <li>
            <strong>Timestamp:</strong> {health.timestamp}
          </li>
        </ul>
      </section>
    </main>
  );
}
