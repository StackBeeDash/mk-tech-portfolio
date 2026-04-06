import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 設定
 *
 * 設計判断:
 * - 3ブラウザ（Chromium, Firefox, WebKit）でクロスブラウザ検証
 * - CI 環境では並列実行 + リトライで安定性確保
 * - ローカルではリトライなし + headed モード可能で開発効率重視
 * - レポーターは HTML（CI アーティファクト用）と list（ターミナル用）を併用
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
