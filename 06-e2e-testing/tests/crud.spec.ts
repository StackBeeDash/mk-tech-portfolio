import { test, expect } from "./fixtures/auth.fixture";
import { TEST_ITEMS } from "./fixtures/test-data";

/**
 * CRUD 操作テスト
 *
 * 認証フィクスチャを使い、ログイン済み状態でテストを実行。
 * テスト対象:
 * - アイテム作成 → 一覧に反映
 * - アイテム検索 → フィルタリング
 * - アイテム更新 → 変更が反映
 * - アイテム削除 → 一覧から消える
 */

test.describe("CRUD 操作", () => {
  test("アイテムを新規作成できる", async ({ dashboardPage }) => {
    const { name, description } = TEST_ITEMS.create;

    await dashboardPage.createItem(name, description);

    // 一覧にアイテムが表示される
    const itemList = dashboardPage.itemList;
    await expect(itemList).toContainText(name);
  });

  test("アイテムを検索できる", async ({ dashboardPage }) => {
    // 事前にアイテムを作成
    await dashboardPage.createItem(
      TEST_ITEMS.search.name,
      TEST_ITEMS.search.description
    );

    // ユニークキーワードで検索
    await dashboardPage.searchItems("ユニーク検索キーワードXYZ");

    // 検索結果に表示される
    const count = await dashboardPage.getItemCount();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(dashboardPage.itemList).toContainText(TEST_ITEMS.search.name);
  });

  test("アイテム名を更新できる", async ({ dashboardPage }) => {
    // 事前にアイテムを作成
    await dashboardPage.createItem(
      TEST_ITEMS.beforeUpdate.name,
      TEST_ITEMS.beforeUpdate.description
    );

    // アイテム名を更新
    await dashboardPage.updateItemName(
      TEST_ITEMS.beforeUpdate.name,
      TEST_ITEMS.afterUpdate.name
    );

    // 更新後の名前で表示される
    await expect(dashboardPage.itemList).toContainText(
      TEST_ITEMS.afterUpdate.name
    );
    // 更新前の名前は表示されない
    await expect(dashboardPage.itemList).not.toContainText(
      TEST_ITEMS.beforeUpdate.name
    );
  });

  test("アイテムを削除できる", async ({ dashboardPage }) => {
    // 事前にアイテムを作成
    await dashboardPage.createItem(
      TEST_ITEMS.delete.name,
      TEST_ITEMS.delete.description
    );

    const countBefore = await dashboardPage.getItemCount();

    // アイテムを削除
    await dashboardPage.deleteItem(TEST_ITEMS.delete.name);

    // 一覧からアイテムが消える
    const countAfter = await dashboardPage.getItemCount();
    expect(countAfter).toBe(countBefore - 1);
    await expect(dashboardPage.itemList).not.toContainText(
      TEST_ITEMS.delete.name
    );
  });

  test("空の名前ではアイテムを作成できない", async ({ dashboardPage }) => {
    await dashboardPage.openCreateDialog();

    const nameInput = dashboardPage.page.getByTestId("item-name-input");
    const submitButton = dashboardPage.page.getByTestId("submit-button");

    // 名前を空のまま送信
    await nameInput.fill("");
    await submitButton.click();

    // バリデーションエラーが表示される
    const error = dashboardPage.page.getByTestId("name-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("名前は必須です");
  });
});
