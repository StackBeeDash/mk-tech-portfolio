import { type Page, type Locator, expect } from "@playwright/test";

/**
 * ベースページオブジェクト
 *
 * 全ページオブジェクトの基底クラス。共通操作を集約し、
 * 各ページオブジェクトは固有の操作のみを実装する。
 *
 * Why:
 * - ナビゲーション、待機、トースト確認など共通操作を DRY に保つ
 * - Page インスタンスの受け渡しパターンを統一
 * - テスト内で page を直接操作するのを避け、抽象度を上げる
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** 指定パスへ遷移 */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** ページタイトルの検証 */
  async expectTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /** URL パスの検証 */
  async expectURL(path: string | RegExp): Promise<void> {
    if (typeof path === "string") {
      await expect(this.page).toHaveURL(new RegExp(path));
    } else {
      await expect(this.page).toHaveURL(path);
    }
  }

  /** トースト通知の表示を待機・検証 */
  async expectToast(message: string): Promise<void> {
    const toast = this.page.locator('[role="alert"]', { hasText: message });
    await expect(toast).toBeVisible({ timeout: 5_000 });
  }

  /** data-testid によるロケータ取得 */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** ページの読み込み完了を待機 */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /** スクリーンショットを取得（デバッグ用） */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
