import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * ダッシュボードページオブジェクト
 *
 * Why:
 * - ダッシュボード固有の操作（アイテム CRUD、統計表示）を集約
 * - テストは「何を検証するか」に集中し、「どう操作するか」は本クラスに委譲
 * - UI リファクタ時もテストコードの変更が最小限で済む
 */
export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly itemList: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly statsCard: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByTestId("dashboard-heading");
    this.userMenu = page.getByTestId("user-menu");
    this.logoutButton = page.getByTestId("logout-button");
    this.itemList = page.getByTestId("item-list");
    this.createButton = page.getByTestId("create-button");
    this.searchInput = page.getByTestId("search-input");
    this.statsCard = page.getByTestId("stats-card");
  }

  /** ダッシュボードへ遷移 */
  async goto(): Promise<void> {
    await this.navigateTo("/dashboard");
  }

  /** ダッシュボードが表示されていることを検証 */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await this.expectURL("/dashboard");
  }

  /** ユーザーメニューからログアウト */
  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  /** 新規アイテム作成ダイアログを開く */
  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
    await expect(this.page.getByTestId("create-dialog")).toBeVisible();
  }

  /** アイテムを作成 */
  async createItem(name: string, description: string): Promise<void> {
    await this.openCreateDialog();
    await this.page.getByTestId("item-name-input").fill(name);
    await this.page.getByTestId("item-description-input").fill(description);
    await this.page.getByTestId("submit-button").click();
    await this.expectToast("アイテムを作成しました");
  }

  /** アイテムを検索 */
  async searchItems(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // debounce 待機
  }

  /** 一覧のアイテム数を取得 */
  async getItemCount(): Promise<number> {
    const items = this.itemList.locator('[data-testid="item-row"]');
    return await items.count();
  }

  /** 指定アイテムの編集ダイアログを開く */
  async openEditDialog(itemName: string): Promise<void> {
    const row = this.itemList.locator('[data-testid="item-row"]', {
      hasText: itemName,
    });
    await row.getByTestId("edit-button").click();
    await expect(this.page.getByTestId("edit-dialog")).toBeVisible();
  }

  /** アイテム名を更新 */
  async updateItemName(
    currentName: string,
    newName: string
  ): Promise<void> {
    await this.openEditDialog(currentName);
    const nameInput = this.page.getByTestId("item-name-input");
    await nameInput.clear();
    await nameInput.fill(newName);
    await this.page.getByTestId("submit-button").click();
    await this.expectToast("アイテムを更新しました");
  }

  /** アイテムを削除 */
  async deleteItem(itemName: string): Promise<void> {
    const row = this.itemList.locator('[data-testid="item-row"]', {
      hasText: itemName,
    });
    await row.getByTestId("delete-button").click();
    // 確認ダイアログ
    await this.page.getByTestId("confirm-delete-button").click();
    await this.expectToast("アイテムを削除しました");
  }

  /** 統計カードの値を取得 */
  async getStatsValue(label: string): Promise<string> {
    const card = this.statsCard.locator(`text=${label}`).locator("..");
    const value = card.locator('[data-testid="stats-value"]');
    return (await value.textContent()) ?? "";
  }
}
