import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../../page-objects/login.page";
import { DashboardPage } from "../../page-objects/dashboard.page";
import { TEST_USERS } from "./test-data";

/**
 * 認証フィクスチャ
 *
 * Why:
 * - テスト前のログイン処理を共通化し、各テストの前処理を簡潔に
 * - Playwright の fixture 機構を活用し、依存関係を宣言的に記述
 * - 認証済み状態のページオブジェクトを直接テストに注入
 *
 * 使い方:
 * ```typescript
 * import { test, expect } from './fixtures/auth.fixture';
 *
 * test('認証済みユーザーのテスト', async ({ authenticatedPage, dashboardPage }) => {
 *   await dashboardPage.expectLoaded();
 * });
 * ```
 */

type AuthFixtures = {
  /** ログイン済みのページ */
  authenticatedPage: Page;
  /** ログインページオブジェクト */
  loginPage: LoginPage;
  /** 認証済みダッシュボードページオブジェクト */
  dashboardPage: DashboardPage;
};

export const test = base.extend<AuthFixtures>({
  /**
   * テスト実行前に標準ユーザーでログインし、
   * 認証済みのページインスタンスを提供する。
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    // ダッシュボードへの遷移を待機
    await page.waitForURL("**/dashboard");
    await use(page);
  },

  /** LoginPage オブジェクトを提供 */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /** 認証済みの DashboardPage オブジェクトを提供 */
  dashboardPage: async ({ authenticatedPage }, use) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    await use(dashboardPage);
  },
});

export { expect } from "@playwright/test";
