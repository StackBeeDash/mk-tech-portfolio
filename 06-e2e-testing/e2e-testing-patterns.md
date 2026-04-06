# E2E テスト設計パターン 学習ノート

> **目的**: E2E テスト領域の知識を体系的に整理し、実プロダクト開発で適用するためのリファレンス。
>
> **想定読者**: 自分自身（将来的に E2E テスト基盤を設計・構築する際の参照用）

## 目次

1. [前提となる上位原則](#前提となる上位原則)
2. [主要なテスト設計パターン](#主要なテスト設計パターン)
3. [パターンの選び方](#パターンの選び方)
4. [Flaky テストとの戦い](#flaky-テストとの戦い)
5. [学習ロードマップ](#学習ロードマップ)
6. [実戦用チェックリスト](#実戦用チェックリスト)
7. [参考リソース](#参考リソース)

---

## 前提となる上位原則

### テストピラミッド

```
       ▲ E2E（少）
      ███ Integration（中）
     █████ Unit（多）
```

**原則**: 下層ほど高速・安定・低コスト。E2E は「ユーザーシナリオの重要経路」のみに絞る。

**注意**: 全機能を E2E でカバーしようとすると破綻する。E2E は実行時間・flaky・保守コストが高い。

### テスティングトロフィー（現代版）

Kent C. Dodds が提唱したモダンな考え方。**Integration テストを重視** する流派。

```
  ▲ E2E
 ███ Integration  ← 厚い
██ Unit
█ Static（型チェック、Lint）
```

SPA（React/Vue）が主流の現代では、こちらが実務に合うことが多い。単体テストの境界が曖昧になりがちで、Integration の方がコストパフォーマンスが良い。

### Arrange-Act-Assert（AAA）

全てのテストの基本構造:

- **Arrange**: 前提条件のセットアップ
- **Act**: 操作の実行
- **Assert**: 結果の検証

BDD スタイルの Given-When-Then と本質的に同じ。

### テストの独立性（Isolation）

**原則**: 各テストは以下の条件を満たすべき。

- 他のテストに依存しない
- 実行順序に依存しない
- 並列実行可能

共有状態を避け、各テストが自分でセットアップ・クリーンアップする。

---

## 主要なテスト設計パターン

### 1. Page Object Model（POM）

**概要**: 1ページ = 1クラスで、UI 操作をカプセル化する最も基本的なパターン。

**目的**: テストコードから HTML セレクタや DOM 操作の詳細を隠蔽する。

#### Before（POM なし）

```typescript
test('ログインできる', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'password');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
});
```

**問題点**:
- セレクタが変更されると全テストを修正する必要がある
- 同じログイン処理が全テストに散らばる
- 「何をテストしているか」が読み取りにくい

#### After（POM あり）

```typescript
// page-objects/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
}

// tests/auth.spec.ts
test('ログインできる', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

**メリット**:
- UI の変更が Page Object 内に閉じる
- テストは「ログインする」という業務操作に集中できる
- 同じ操作を全テストで再利用可能

**適用場面**: ほぼ全てのケースで基礎となる。まず POM を習得すべき。

---

### 2. Screenplay Pattern（スクリーンプレイ）

**概要**: POM の進化版。主語を「ページ」ではなく「**アクター（ユーザー）**」にする。

**構成要素**:
- **Actor（アクター）**: ユーザーの役割
- **Task（タスク）**: ユーザーが行う業務操作
- **Question（質問）**: 状態を問い合わせる
- **Ability（能力）**: アクターが持つ機能（ブラウザ操作、API 呼び出し等）

```typescript
// Screenplay 風のイメージ
const admin = Actor.named('管理者').whoCan(BrowseTheWeb.using(page));

await admin.attemptsTo(
  Login.withCredentials('admin@example.com', 'password'),
  CreateCampaign.withName('Spring Sale').withBudget(1000),
  SubmitForApproval.theCampaign('Spring Sale'),
);

await admin.asksFor(Verify.that(CampaignStatus.of('Spring Sale'), equals('pending_approval')));
```

**POM との違い**:
- 主語が「ページ」ではなく「ユーザー」
- 業務操作（Task）とUI操作（Ability）を分離
- 複数ロール（管理者、一般ユーザー）を扱う時に強力

**メリット**:
- ビジネスシナリオがテストコードに直接反映される
- 複雑なシナリオでも読める
- ロールごとの権限テストが自然に書ける

**デメリット**:
- 学習コスト高
- 小規模プロジェクトにはオーバースペック
- 抽象化のレイヤーが多く、デバッグが難しくなる場合がある

**適用場面**: 大規模、複数ロール、複雑な業務フロー（基幹系、BtoB SaaS）

**代表的ライブラリ**:
- [Serenity/JS](https://serenity-js.org/)（JavaScript/TypeScript）
- [Serenity BDD](https://serenity-bdd.github.io/)（Java）

---

### 3. Component Object Pattern

**概要**: Page Object を **コンポーネント単位** に分解する現代的な発想。

**背景**: モダン SPA（React/Vue）では、ページは多数のコンポーネントで構成される。「ページ」という単位が不自然になりつつある。

```typescript
// components/header.component.ts
export class HeaderComponent {
  constructor(private page: Page) {}

  async clickUserMenu() {
    await this.page.click('[data-testid="user-menu"]');
  }

  async logout() {
    await this.clickUserMenu();
    await this.page.click('[data-testid="logout"]');
  }
}

// components/data-table.component.ts
export class DataTableComponent {
  constructor(private page: Page, private tableSelector: string) {}

  async sortBy(column: string) {
    await this.page.click(`${this.tableSelector} th[data-column="${column}"]`);
  }

  async getRowCount(): Promise<number> {
    return await this.page.locator(`${this.tableSelector} tbody tr`).count();
  }
}

// pages/dashboard.page.ts
export class DashboardPage {
  header: HeaderComponent;
  itemsTable: DataTableComponent;

  constructor(private page: Page) {
    this.header = new HeaderComponent(page);
    this.itemsTable = new DataTableComponent(page, '[data-testid="items-table"]');
  }
}
```

**メリット**:
- 複数ページで使われるコンポーネント（ヘッダー、テーブル等）を共通化
- React/Vue のコンポーネント構造と1対1で対応する
- 再利用性が高い

**適用場面**: デザインシステムが整備された SPA、コンポーネントライブラリを使うプロジェクト

---

### 4. Fluent Interface / Builder Pattern

**概要**: メソッドチェーンで読みやすいテストコードを書く。

```typescript
await loginPage
  .enterEmail('user@example.com')
  .enterPassword('password')
  .clickLogin()
  .expectDashboard();
```

**実装のポイント**: 各メソッドが `this` または Page Object インスタンスを返す。

**メリット**: 手順が自然言語に近くなる

**デメリット**: 過度に使うと逆に読みにくくなる。複雑なロジックには向かない。

**適用場面**: 単純な一連の操作（フォーム入力など）

---

### 5. Fixture Pattern（フィクスチャ）

**概要**: テストの **前提条件（セットアップ）を再利用可能な単位で管理** する。

**Playwright では一級市民**: `test.extend()` で独自フィクスチャを定義できる。

```typescript
// fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // ログイン処理
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    await page.waitForURL('/dashboard');

    await use(page);

    // クリーンアップ
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    // 管理者としてログイン...
  },
});

// tests/dashboard.spec.ts
import { test } from '../fixtures/auth.fixture';

test('認証済みユーザーはダッシュボードにアクセスできる', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // 既にログイン済みの状態から開始できる
});
```

**メリット**:
- 各テストで毎回ログイン処理を書かなくていい
- 並列実行時の状態分離が自動的に保証される
- ロール別（admin, user, guest）のセットアップを綺麗に整理できる

**実戦 Tips**:
- **Storage State の活用**: 認証済みのクッキー・ローカルストレージを JSON に保存し、全テストで再利用するとログイン処理のオーバーヘッドを削減できる
- **ワーカースコープ**: 複数のテストで共有したい重いセットアップは worker scope で定義

---

### 6. Test Data Builder Pattern

**概要**: テストデータの生成を専用ビルダーに任せる。

```typescript
// builders/user.builder.ts
export class UserBuilder {
  private data: Partial<User> = {
    id: generateId(),
    name: 'Default User',
    email: 'default@example.com',
    role: 'user',
    tenantId: 'default-tenant',
  };

  withRole(role: 'admin' | 'user' | 'guest'): this {
    this.data.role = role;
    return this;
  }

  withTenant(tenantId: string): this {
    this.data.tenantId = tenantId;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  build(): User {
    return this.data as User;
  }
}

// 使用側
const admin = new UserBuilder()
  .withRole('admin')
  .withTenant('tenant-a')
  .build();
```

**DDD との類似**: DDD の集約の組み立てと発想が似ている。

**メリット**:
- テストが「何をテストしているか」に集中できる
- デフォルト値を隠蔽し、差分だけ指定
- テストデータのバリエーションを柔軟に作れる

**適用場面**: テストデータが複雑、バリエーションが多いケース

---

### 7. Object Mother Pattern

**概要**: **「典型的なテストデータ」を名前付きで提供** するファクトリー。Test Data Builder の前段。

```typescript
// test-data/users.ts
export const TestUsers = {
  admin: (): User => ({
    id: 'admin-1',
    name: 'Admin User',
    role: 'admin',
    email: 'admin@example.com',
  }),

  guestUser: (): User => ({
    id: 'guest-1',
    name: 'Guest',
    role: 'guest',
    email: 'guest@example.com',
  }),

  activeMember: (): User => ({
    id: 'member-1',
    name: 'Active Member',
    role: 'user',
    email: 'member@example.com',
    subscriptionStatus: 'active',
  }),
};

// 使用側
const admin = TestUsers.admin();
```

**Builder との使い分け**:
- **Object Mother**: 定型パターンの再利用（90% のケース）
- **Test Data Builder**: 特殊バリエーションが必要な時（10%）

両者を組み合わせて使うのが実務的には強い。

```typescript
// 典型データをベースに差分だけ指定
const admin = TestUsers.admin();
const adminInSpecialTenant = new UserBuilder()
  .fromExisting(admin)
  .withTenant('special-tenant')
  .build();
```

---

### 8. Test Double Patterns（テストダブル）

**概要**: 本物の依存を置き換える手法の総称。E2E に限らず全てのテストで重要。

| 名前 | 役割 | 使い分け |
|------|------|---------|
| **Stub** | 決まった値を返すだけ | API レスポンスの固定 |
| **Mock** | 呼び出しを検証する | 「この関数が呼ばれたか」を確認 |
| **Spy** | 呼び出しを記録する | 後から呼び出し履歴を参照 |
| **Fake** | 簡易実装（インメモリDB等） | 本物の代替となる動作する実装 |
| **Dummy** | 型を満たすためのダミー | 使われないが必要な引数 |

**E2E での原則**: **本物の統合を重視する**ので Mock は最小限に。ただし以下はモック化の対象:
- 外部決済 API（Stripe 等）
- メール送信
- 外部 SaaS API
- 時刻依存のロジック

**Playwright のネットワークモック**:

```typescript
await page.route('**/api/payments', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true, transactionId: 'mock-123' }),
  });
});
```

---

### 9. Given-When-Then（BDD スタイル）

**概要**: テストの構造を **「前提 → 操作 → 検証」** に揃える。

```typescript
test('管理者は下書きキャンペーンを承認できる', async ({ page }) => {
  // Given: 前提（管理者としてログインし、下書きキャンペーンが存在する）
  const campaign = await CampaignBuilder.draft().build();
  await loginAs(page, TestUsers.admin());
  await page.goto(`/campaigns/${campaign.id}`);

  // When: 操作（承認ボタンをクリック）
  await page.click('[data-testid="approve-button"]');
  await page.click('[data-testid="confirm-dialog-ok"]');

  // Then: 検証（ステータスが active になる）
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Active');
});
```

**価値**: テストが「仕様書」になる。非エンジニアも読める。

**発展形**: [Cucumber/Gherkin](https://cucumber.io/) で **自然言語でシナリオを記述** する方式もある。

```gherkin
Feature: キャンペーン承認

Scenario: 管理者は下書きキャンペーンを承認できる
  Given 管理者としてログインしている
  And 下書きキャンペーンが存在する
  When 承認ボタンをクリックする
  Then キャンペーンのステータスが Active になる
```

**適用場面**: 非エンジニア（プロダクトマネージャー、QA）も仕様を読む必要がある場合

---

## パターンの選び方

### プロジェクト規模別の推奨

| 状況 | 推奨パターン |
|------|-------------|
| 小〜中規模、数十テスト | POM + Fixture + Given-When-Then |
| SPA（React/Vue）多コンポーネント | Component Object + Fixture |
| 大規模、複数ロール、複雑シナリオ | Screenplay + Test Data Builder |
| テストデータのバリエーションが多い | Test Data Builder + Object Mother |
| 非エンジニアも仕様を読む | Gherkin/Cucumber + Given-When-Then |

### 組み合わせの実例

実務では複数パターンを組み合わせて使うのが普通。

**中規模 SPA の典型構成**:

```
POM（基礎）
 ├ Component Object（UIコンポーネント単位に分解）
 ├ Fixture（認証、DB状態）
 ├ Test Data Builder（テストデータ生成）
 └ Given-When-Then（テスト構造）
```

---

## Flaky テストとの戦い

E2E テストの最大の敵は「**時々落ちるテスト**」。信頼できないテストは存在しないより悪い。

### 主な原因と対策

| 原因 | 対策 |
|------|------|
| タイミング依存 | Playwright の auto-waiting を信頼する、明示的な `waitFor` |
| 外部サービス依存 | 外部 API はモック化、安定したテスト環境 |
| テスト間の状態共有 | 各テスト独立 + Fixture でセットアップ |
| ランダム性 | 固定シード、決定的なテストデータ |
| ネットワーク遅延 | タイムアウト設定を適切に、リトライ機構 |
| アニメーション | `reducedMotion: 'reduce'` で無効化 |

### やってはいけないこと

- **`page.waitForTimeout(3000)` のような固定待機** — 時間ベースの待機は不安定の温床
- **retries を無闇に増やす** — 症状の隠蔽。まず原因を潰す
- **環境依存のテスト** — 自分のマシンでしか通らない

### やるべきこと

- **auto-waiting の理解**: Playwright は要素の可視性・操作可能性を自動で待つ
- **明示的な期待値**: `await expect(locator).toHaveText('Expected')` のように「何を待つか」を明示
- **独立性の徹底**: 各テストが自分でセットアップ・クリーンアップ
- **決定的なデータ**: タイムスタンプや ID はテスト開始時点で固定

---

## 学習ロードマップ

E2E テスト初学者から実務家までのステップ。

### Step 1: 基礎を固める（1〜2週間）

**ゴール**: 1つの機能に対して安定した E2E テストを書けるようになる。

**学ぶこと**:
- Playwright の基本操作（`goto`, `click`, `fill`, `expect`）
- セレクタの基本（`data-testid` を推奨）
- auto-waiting の理解
- Arrange-Act-Assert の構造

**実践課題**: ログインフォームのテストを書く

### Step 2: POM の習得（1週間）

**ゴール**: 複数のテストで UI 操作を再利用できるようになる。

**学ぶこと**:
- Page Object の設計
- BasePage による共通操作の抽出
- セレクタのカプセル化

**実践課題**: ログイン + ダッシュボード + 設定画面の Page Object を作る

### Step 3: Fixture と認証(1週間)

**ゴール**: テストごとのセットアップを最小化する。

**学ぶこと**:
- Playwright の `test.extend()`
- Storage State による認証状態の再利用
- ロール別 Fixture

**実践課題**: `authenticatedPage` と `adminPage` の Fixture を作る

### Step 4: テストデータ管理（1〜2週間）

**ゴール**: テストデータを体系的に管理できるようになる。

**学ぶこと**:
- Object Mother（典型データ）
- Test Data Builder（バリエーション）
- DB シーディング戦略
- テスト間のデータ独立性

**実践課題**: ユーザー、キャンペーン等のビルダーを作る

### Step 5: Component Object への分解（1週間）

**ゴール**: SPA のコンポーネント構造に合わせたテストが書ける。

**学ぶこと**:
- 再利用可能なコンポーネント操作の抽出
- ヘッダー、モーダル、テーブル等の共通化
- ページオブジェクトとの組み合わせ方

**実践課題**: DataTable, Modal, Header の Component Object を作る

### Step 6: CI 統合と運用（1週間）

**ゴール**: CI/CD で E2E テストを安定運用できる。

**学ぶこと**:
- 並列実行とワーカー設定
- リトライ戦略
- スクリーンショット・トレース取得
- 失敗時のデバッグ手順

**実践課題**: GitHub Actions で PR 時に自動実行、失敗時にトレース添付

### Step 7: 発展 — Screenplay or Gherkin（2〜4週間）

**ゴール**: 大規模・複雑なシステムに対応できる。

**学ぶこと**:
- Screenplay Pattern の思想と実装
- または Cucumber/Gherkin による BDD

**実践課題**: 既存の POM ベースのテストを Screenplay に書き換えてみる

---

## 実戦用チェックリスト

実際のプロダクトで E2E テストを導入する際のチェックリスト。

### プロジェクト開始時

- [ ] テストピラミッドのどこに位置づけるかを明確にする
- [ ] E2E でカバーする範囲を「クリティカルパスのみ」に絞る
- [ ] `data-testid` 属性の命名規則を決める
- [ ] Playwright のプロジェクト設定（複数ブラウザ、並列数、リトライ）
- [ ] ローカル実行用と CI 実行用の設定を分ける

### アーキテクチャ設計時

- [ ] ディレクトリ構造を決める
  ```
  e2e/
  ├ page-objects/
  ├ components/
  ├ fixtures/
  ├ builders/
  ├ test-data/
  └ tests/
  ```
- [ ] BasePage の共通操作を定義
- [ ] 認証 Fixture を最初に整備
- [ ] Storage State の保存先と更新戦略を決める

### テスト実装時

- [ ] Given-When-Then の構造で書く
- [ ] セレクタは `data-testid` を優先
- [ ] `waitForTimeout` を使わない
- [ ] テスト間の依存を作らない
- [ ] テストデータは Fixture / Builder で生成
- [ ] 期待値は具体的に（`expect(x).toBeTruthy()` より `expect(x).toHaveText('Login')`）

### CI 統合時

- [ ] 並列実行の設定
- [ ] 失敗時のトレース・スクリーンショット保存
- [ ] リトライは最小限（2回まで）
- [ ] 実行時間の監視（閾値を超えたらアラート）
- [ ] flaky テストの検知と隔離

### 運用時

- [ ] 定期的な flaky テストの棚卸し
- [ ] 実行時間の最適化（並列度、Fixture の工夫）
- [ ] テストの追加・削除の基準を明文化
- [ ] 失敗時のトリアージ手順

---

## よくある落とし穴

### 1. E2E でなんでもテストしようとする

**症状**: テストスイートの実行に1時間以上かかる、flaky テストが頻発

**対策**: 単体・統合テストで担保できるものは下層に移す。E2E は「ユーザー体験の重要経路」のみ。

### 2. セレクタに CSS クラスを使う

```typescript
// 悪い例
await page.click('.btn-primary.large');
```

**症状**: スタイル変更でテストが壊れる

**対策**: `data-testid` 専用属性を使う

```typescript
// 良い例
await page.click('[data-testid="submit-button"]');
```

### 3. Page Object にアサーションを書く

**症状**: Page Object が肥大化、テスト意図が分散

**対策**: Page Object は「操作」のみ、アサーションは「テスト」側に書く

ただし、複雑なUI 状態の判定（例: 「エラーメッセージが表示されているか」）は Page Object に getter として提供するのは OK。

### 4. テスト間で状態を共有する

**症状**: 実行順序を変えると落ちる、並列実行できない

**対策**: 各テストが独立してセットアップ・クリーンアップする

### 5. 待機を `setTimeout` で書く

**症状**: 環境差で不安定、無駄な待機時間

**対策**: Playwright の auto-waiting を信頼、明示的に待つ場合は `waitFor` を使う

---

## 参考リソース

### 公式ドキュメント

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### 書籍

- 『Growing Object-Oriented Software, Guided by Tests』(Freeman & Pryce) — Test Double の分類の原典
- 『xUnit Test Patterns』(Gerard Meszaros) — テストパターンの百科事典

### Web リソース

- [Martin Fowler: Test Double](https://martinfowler.com/bliki/TestDouble.html)
- [Martin Fowler: Page Object](https://martinfowler.com/bliki/PageObject.html)
- [Kent C. Dodds: Testing Trophy](https://kentcdodds.com/blog/write-tests)
- [Serenity/JS: Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern.html)

### E2E フレームワーク比較

- Playwright（推奨、モダンな選択）
- Cypress（老舗、コミュニティ大きい）
- Selenium（レガシー、エンタープライズで根強い）
- WebdriverIO（Selenium の現代的なラッパー）

---

## 個人的な振り返りメモ欄

> 実際にプロダクト開発で E2E テストを導入した際の経験・気づきを記録する欄。

### プロジェクト 1: _(未記入)_

- プロジェクト名:
- 採用したパターン:
- うまくいったこと:
- 苦労したこと:
- 次回改善したいこと:

### プロジェクト 2: _(未記入)_

- プロジェクト名:
- 採用したパターン:
- うまくいったこと:
- 苦労したこと:
- 次回改善したいこと:

---

## 補足: DDD との関連性

E2E テストの設計は、実は **ドメイン知識の言語化能力** と強く相関する。

`loginPage.login()` や `CampaignBuilder.withBudget()` といった API の命名は、その機能の「本質」を言語化する作業である。これは DDD のユビキタス言語を定義する作業と同じスキルセットを使う。

**教訓**: Page Object の命名を真剣に考えることは、ドメインの理解を深める訓練になる。単なるテスト技法ではなく、設計スキル全般の底上げに繋がる。

この視点は [ADR-004: DDD 適用の判断基準](https://github.com/StackBeeDash/mk-tech-portfolio/discussions/41) とも通底している。AI エージェントと組み合わせれば、テストコードを書く過程で自然とドメインの言語化が進む。

---

**Last updated**: 2026-04-06
