import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/login.page";
import { DashboardPage } from "../page-objects/dashboard.page";
import { TEST_USERS, ROUTES } from "./fixtures/test-data";

/**
 * 認証フローテスト
 *
 * テスト対象:
 * - 正常なログイン → ダッシュボード遷移
 * - 無効な認証情報でのエラー表示
 * - ログアウト → ログインページへリダイレクト
 * - セッション管理（認証なしでの保護ページアクセス）
 */

test.describe("認証フロー", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("ログインフォームが正しく表示される", async () => {
    await loginPage.expectFormVisible();
    await loginPage.expectURL(ROUTES.login);
  });

  test("正しい認証情報でログインするとダッシュボードに遷移する", async ({
    page,
  }) => {
    await loginPage.login(
      TEST_USERS.standard.email,
      TEST_USERS.standard.password
    );

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectURL(ROUTES.dashboard);
  });

  test("無効な認証情報でエラーメッセージが表示される", async () => {
    await loginPage.login(
      TEST_USERS.invalid.email,
      TEST_USERS.invalid.password
    );

    await loginPage.expectError(
      "メールアドレスまたはパスワードが正しくありません"
    );
    await loginPage.expectURL(ROUTES.login);
  });

  test("空のメールアドレスでバリデーションエラーが表示される", async () => {
    await loginPage.login("", TEST_USERS.standard.password);
    await loginPage.expectEmailValidationError();
  });

  test("パスワードが空の場合にログインボタンが無効になる", async () => {
    await loginPage.emailInput.fill(TEST_USERS.standard.email);
    await expect(loginPage.loginButton).toBeDisabled();
  });
});

test.describe("ログアウト", () => {
  test("ログアウト後にログインページへリダイレクトされる", async ({
    page,
  }) => {
    // まずログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TEST_USERS.standard.email,
      TEST_USERS.standard.password
    );

    // ダッシュボードでログアウト
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();

    // ログインページにリダイレクト
    await expect(page).toHaveURL(new RegExp(ROUTES.login));
  });
});

test.describe("セッション管理", () => {
  test("未認証でダッシュボードにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto(ROUTES.dashboard);
    await expect(page).toHaveURL(new RegExp(ROUTES.login));
  });

  test("未認証で設定ページにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto(ROUTES.settings);
    await expect(page).toHaveURL(new RegExp(ROUTES.login));
  });
});
