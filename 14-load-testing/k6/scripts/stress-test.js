import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// --- カスタムメトリクス ---
const errorRate = new Rate("custom_error_rate");
const responseTrend = new Trend("custom_response_time", true);

// --- テスト設定 ---
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const API_PATH = "/api/v1";

export const options = {
  // ストレステスト: 段階的に負荷を増加させ、ブレークポイントを特定
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        // ウォームアップ
        { duration: "30s", target: 10 },

        // Stage 1: 軽負荷
        { duration: "1m", target: 25 },

        // Stage 2: 通常負荷
        { duration: "1m", target: 50 },

        // Stage 3: 中負荷
        { duration: "1m", target: 100 },

        // Stage 4: 高負荷
        { duration: "1m", target: 200 },

        // Stage 5: 限界突破テスト
        { duration: "1m", target: 400 },

        // Stage 6: 過負荷
        { duration: "1m", target: 600 },

        // クールダウン（回復性の確認）
        { duration: "30s", target: 50 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },

  // 閾値（ストレステストでは通常より緩めに設定）
  thresholds: {
    // P95 レスポンスタイム 2000ms 以内（ストレステストの許容範囲）
    http_req_duration: ["p(95)<2000"],

    // エラー率 5% 未満（ストレステストの許容範囲）
    http_req_failed: ["rate<0.05"],

    // カスタムエラー率
    custom_error_rate: ["rate<0.05"],
  },
};

// --- メインシナリオ ---
export default function () {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // 読み取り系リクエスト（最も多いパターン）
  const listRes = http.get(`${BASE_URL}${API_PATH}/items?skip=0&limit=20`, {
    headers,
    tags: { endpoint: "GET /items" },
  });

  responseTrend.add(listRes.timings.duration);

  const listOk = check(listRes, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
    "response time < 2000ms": (r) => r.timings.duration < 2000,
  });

  errorRate.add(!listOk);

  // 書き込み系リクエスト（20% の確率で実行 — 実際のトラフィックパターンを模倣）
  if (Math.random() < 0.2) {
    const payload = JSON.stringify({
      name: `Stress Test Item ${Date.now()}`,
      description: "Created during stress test",
      price: Math.floor(Math.random() * 10000) + 100,
      category: "test",
    });

    const createRes = http.post(`${BASE_URL}${API_PATH}/items`, payload, {
      headers,
      tags: { endpoint: "POST /items" },
    });

    responseTrend.add(createRes.timings.duration);

    const createOk = check(createRes, {
      "create status is 2xx": (r) => r.status >= 200 && r.status < 300,
      "create response time < 3000ms": (r) => r.timings.duration < 3000,
    });

    errorRate.add(!createOk);
  }

  // 実ユーザーの思考時間（ストレステストでは短めに設定）
  sleep(Math.random() * 0.5 + 0.5);
}

// --- テスト完了時のサマリー ---
export function handleSummary(data) {
  // 各ステージでのパフォーマンスを分析するためのサマリー
  const p50 = data.metrics.http_req_duration?.values?.["p(50)"];
  const p90 = data.metrics.http_req_duration?.values?.["p(90)"];
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"];
  const p99 = data.metrics.http_req_duration?.values?.["p(99)"];
  const errRate = data.metrics.http_req_failed?.values?.rate;
  const maxVUs = data.metrics.vus_max?.values?.value;

  const report = `
=== Stress Test Results ===
Max VUs:         ${maxVUs}
P50 Latency:     ${p50?.toFixed(2)}ms
P90 Latency:     ${p90?.toFixed(2)}ms
P95 Latency:     ${p95?.toFixed(2)}ms
P99 Latency:     ${p99?.toFixed(2)}ms
Error Rate:      ${(errRate * 100)?.toFixed(2)}%

Breakpoint Analysis:
- If P95 > 2000ms, the system is at its limit.
- If error rate > 5%, the system has exceeded capacity.
===========================
`;

  return {
    stdout: report,
    "results/k6-stress-summary.json": JSON.stringify(data, null, 2),
  };
}
