/**
 * ヘルスチェックルート
 *
 * shared パッケージの HealthCheckResponse 型を使用。
 * フロントエンドとバックエンドで同じ型を共有することで、
 * API レスポンスの型安全性を保証する。
 */

import { Hono } from "hono";
import type { HealthCheckResponse } from "@monorepo-demo/shared";
import { formatDate } from "@monorepo-demo/shared";

const healthRoute = new Hono();

const startTime = Date.now();

healthRoute.get("/", (c) => {
  const now = new Date();
  const response: HealthCheckResponse = {
    status: "healthy",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: now.toISOString(),
  };

  return c.json(response);
});

healthRoute.get("/detailed", (c) => {
  const now = new Date();
  return c.json({
    status: "healthy",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: now.toISOString(),
    date: formatDate(now),
    environment: process.env.NODE_ENV ?? "development",
    node: process.version,
  });
});

export { healthRoute };
