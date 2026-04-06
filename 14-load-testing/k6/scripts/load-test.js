import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// --- カスタムメトリクス ---
const errorRate = new Rate("custom_error_rate");
const itemCreated = new Counter("items_created");
const getItemsDuration = new Trend("get_items_duration", true);
const createItemDuration = new Trend("create_item_duration", true);

// --- テスト設定 ---
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const API_PATH = "/api/v1";

export const options = {
  // 通常負荷テスト + スパイクテスト
  scenarios: {
    // シナリオ 1: 通常負荷（段階的増加 → 定常 → 段階的減少）
    normal_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 }, // Ramp-up: 30秒で 20 VU まで増加
        { duration: "2m", target: 20 }, // Steady: 2分間 20 VU を維持
        { duration: "30s", target: 0 }, // Ramp-down: 30秒で 0 VU まで減少
      ],
      gracefulRampDown: "10s",
      tags: { scenario: "normal_load" },
    },

    // シナリオ 2: スパイクテスト（急激な負荷変動）
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 }, // ウォームアップ
        { duration: "5s", target: 100 }, // スパイク: 急激に 100 VU
        { duration: "30s", target: 100 }, // スパイク維持
        { duration: "5s", target: 5 }, // 急減
        { duration: "30s", target: 5 }, // 回復確認
        { duration: "5s", target: 0 }, // 終了
      ],
      startTime: "3m30s", // 通常負荷テスト終了後に開始
      tags: { scenario: "spike" },
    },
  },

  // SLA ベースの閾値
  thresholds: {
    // 全体のレスポンスタイム
    http_req_duration: [
      "p(95)<500", // P95 が 500ms 以内
      "p(99)<1000", // P99 が 1000ms 以内
    ],

    // エラー率
    http_req_failed: [
      "rate<0.01", // エラー率 1% 未満
    ],

    // カスタムメトリクス
    custom_error_rate: [
      "rate<0.01", // カスタムエラー率 1% 未満
    ],

    // 個別エンドポイントの閾値
    get_items_duration: [
      "p(95)<400", // GET /items は P95 400ms 以内
    ],
    create_item_duration: [
      "p(95)<600", // POST /items は P95 600ms 以内
    ],
  },
};

// --- テストデータ ---
const itemNames = [
  "Widget Alpha",
  "Widget Beta",
  "Gadget Gamma",
  "Tool Delta",
  "Accessory Epsilon",
  "Widget Zeta",
  "Gadget Eta",
  "Tool Theta",
  "Accessory Iota",
  "Widget Kappa",
];

const categories = ["electronics", "gadgets", "tools", "accessories"];

function randomItem() {
  return {
    name: itemNames[Math.floor(Math.random() * itemNames.length)],
    description: `Load test item created at ${new Date().toISOString()}`,
    price: Math.floor(Math.random() * 10000) + 100,
    category: categories[Math.floor(Math.random() * categories.length)],
  };
}

// --- メインシナリオ ---
export default function () {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  group("CRUD Operations", () => {
    // 1. GET /items - 一覧取得
    group("List Items", () => {
      const listRes = http.get(`${BASE_URL}${API_PATH}/items?skip=0&limit=20`, {
        headers,
        tags: { endpoint: "GET /items" },
      });

      getItemsDuration.add(listRes.timings.duration);

      const listOk = check(listRes, {
        "GET /items status is 200": (r) => r.status === 200,
        "GET /items response time < 500ms": (r) => r.timings.duration < 500,
        "GET /items returns array": (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body) || (body.items && Array.isArray(body.items));
          } catch {
            return false;
          }
        },
      });

      errorRate.add(!listOk);
    });

    // 2. POST /items - アイテム作成
    let createdId = null;
    group("Create Item", () => {
      const payload = JSON.stringify(randomItem());
      const createRes = http.post(`${BASE_URL}${API_PATH}/items`, payload, {
        headers,
        tags: { endpoint: "POST /items" },
      });

      createItemDuration.add(createRes.timings.duration);

      const createOk = check(createRes, {
        "POST /items status is 201": (r) => r.status === 201,
        "POST /items response time < 1000ms": (r) => r.timings.duration < 1000,
        "POST /items returns id": (r) => {
          try {
            const body = JSON.parse(r.body);
            createdId = body.id;
            return !!body.id;
          } catch {
            return false;
          }
        },
      });

      if (createOk) {
        itemCreated.add(1);
      }
      errorRate.add(!createOk);
    });

    // 3. GET /items/{id} - 個別取得
    if (createdId) {
      group("Get Item Detail", () => {
        const getRes = http.get(`${BASE_URL}${API_PATH}/items/${createdId}`, {
          headers,
          tags: { endpoint: "GET /items/{id}" },
        });

        const getOk = check(getRes, {
          "GET /items/{id} status is 200": (r) => r.status === 200,
          "GET /items/{id} response time < 300ms": (r) => r.timings.duration < 300,
        });

        errorRate.add(!getOk);
      });

      // 4. PUT /items/{id} - 更新
      group("Update Item", () => {
        const updatePayload = JSON.stringify({
          ...randomItem(),
          name: `Updated - ${Date.now()}`,
        });

        const putRes = http.put(
          `${BASE_URL}${API_PATH}/items/${createdId}`,
          updatePayload,
          {
            headers,
            tags: { endpoint: "PUT /items/{id}" },
          }
        );

        const putOk = check(putRes, {
          "PUT /items/{id} status is 200": (r) => r.status === 200,
        });

        errorRate.add(!putOk);
      });

      // 5. DELETE /items/{id} - 削除
      group("Delete Item", () => {
        const delRes = http.del(`${BASE_URL}${API_PATH}/items/${createdId}`, null, {
          headers,
          tags: { endpoint: "DELETE /items/{id}" },
        });

        const delOk = check(delRes, {
          "DELETE /items/{id} status is 204": (r) => r.status === 204,
        });

        errorRate.add(!delOk);
      });
    }
  });

  // リクエスト間に 1〜3 秒のランダムスリープ（実ユーザーの思考時間をシミュレート）
  sleep(Math.random() * 2 + 1);
}

// --- テスト完了時のサマリー出力 ---
export function handleSummary(data) {
  const summary = {
    metrics: {
      http_req_duration_p95: data.metrics.http_req_duration?.values?.["p(95)"],
      http_req_duration_p99: data.metrics.http_req_duration?.values?.["p(99)"],
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate,
      iterations: data.metrics.iterations?.values?.count,
      vus_max: data.metrics.vus_max?.values?.value,
    },
    thresholds_passed: !Object.values(data.metrics).some(
      (m) => m.thresholds && Object.values(m.thresholds).some((t) => !t.ok)
    ),
  };

  return {
    stdout: JSON.stringify(summary, null, 2) + "\n",
    "results/k6-summary.json": JSON.stringify(data, null, 2),
  };
}
