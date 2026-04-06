/**
 * Hono バックエンド - エントリポイント
 *
 * 最小構成の API サーバー。shared パッケージの型定義を使用して
 * モノレポ内パッケージ間の連携をデモする。
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoute } from "./routes/health";

const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ルート
app.route("/health", healthRoute);

// ルートエンドポイント
app.get("/", (c) => {
  return c.json({
    name: "@monorepo-demo/api",
    version: "0.1.0",
    docs: "/health",
  });
});

const port = Number(process.env.PORT ?? 8787);
console.log(`API server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
