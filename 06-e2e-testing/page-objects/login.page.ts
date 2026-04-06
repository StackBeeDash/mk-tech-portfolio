import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * ログインページオブジェクト
 *
 * Why Page Object パターン:
 * - セレクタの変更が本クラスに閉じる（テスト側の修正不要）
 * - login() メソッドにより、テストコードがビジネス意図を表現
 * - バリデーションエラーの検証も一箇所に集約
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId("email-input");
    this.passwordInput = page.getByTestId("password-input");
    this.loginButton = page.getByTestId("login-button");
    this.errorMessage = page.getByTestId("error-message");
    this.rememberMeCheckbox = page.getByTestId("remember-me");
    this.forgotPasswordLink = page.getByTestId("forgot-password-link");
  }

  /** ログインページへ遷移 */
  async goto(): Promise<void> {
    await this.navigateTo("/login");
  }

  /** メールアドレスとパスワードでログイン */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** 「ログイン状態を保持」にチェックしてログイン */
  async loginWithRememberMe(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.loginButton.click();
  }

  /** エラーメッセージの表示を検証 */
  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /** ログインフォームが表示されていることを検証 */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /** メール入力欄のバリデーションエラーを検証 */
  async expectEmailValidationError(): Promise<void> {
    const emailError = this.page.getByTestId("email-error");
    await expect(emailError).toBeVisible();
  }
}
