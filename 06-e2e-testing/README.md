# 06: E2E Testing — Playwright テスト基盤 & Page Object

## Overview

Playwright を使った E2E テスト基盤の設計と、Page Object パターンによるテストコードの構造化を示すポートフォリオです。

## なぜこの設計にしたか（Why）

### テストピラミッドにおける E2E テストの位置づけ

テストピラミッドでは、Unit → Integration → E2E の順にテスト数を減らすのが定石です。E2E テストはコストが高い（実行時間・メンテナンス）ため、**ビジネスクリティカルなフローに絞って書く**方針を採用しました。

```
    /  E2E  \        ← 少数・高価値（認証、主要 CRUD）
   / Integration \    ← API 結合、DB 操作
  /    Unit Tests   \ ← 多数・高速（ロジック単体）
```

### なぜ Playwright を選んだか

| 観点 | Playwright | Cypress |
|------|-----------|---------|
| マルチブラウザ | Chromium, Firefox, WebKit | Chromium 中心 |
| 並列実行 | ネイティブサポート | 有料プラン必要 |
| Auto-wait | 組み込み | 組み込み |
| ネットワーク制御 | route() で柔軟 | intercept() |
| CI 統合 | GitHub Actions 公式対応 | 対応 |

**決め手**: マルチブラウザ対応とネイティブ並列実行により、CI パイプラインでの実行効率が高い。

### なぜ Page Object パターンを採用したか

1. **関心の分離**: テストロジック（what to test）とページ操作（how to interact）を分離
2. **DRY 原則**: セレクタの変更が1箇所で済む。UI 変更時のメンテナンスコストを削減
3. **可読性**: テストコードがビジネスシナリオとして読める
4. **再利用性**: 同じページ操作を複数テストで共有

```typescript
// Page Object なし — セレクタが散在
await page.fill('[data-testid="email"]', 'user@example.com');
await page.fill('[data-testid="password"]', 'password');
await page.click('[data-testid="login-button"]');

// Page Object あり — 意図が明確
await loginPage.login('user@example.com', 'password');
```

## ディレクトリ構成

```
06-e2e-testing/
├── README.md                    # 本ファイル
├── package.json                 # 依存関係
├── tsconfig.json                # TypeScript 設定
├── playwright.config.ts         # Playwright 設定
├── page-objects/
│   ├── base.page.ts             # 共通操作（ナビゲーション、待機）
│   ├── login.page.ts            # ログインページ操作
│   └── dashboard.page.ts        # ダッシュボードページ操作
└── tests/
    ├── auth.spec.ts             # 認証フローテスト
    ├── crud.spec.ts             # CRUD 操作テスト
    └── fixtures/
        ├── test-data.ts         # テストデータ定義
        └── auth.fixture.ts      # 認証フィクスチャ
```

## テスト戦略

### スコープ

- **認証フロー**: ログイン → セッション維持 → ログアウト
- **CRUD 操作**: アイテムの作成 → 一覧表示 → 更新 → 削除
- **エラーハンドリング**: バリデーションエラー、認証エラー

### CI 統合方針

```yaml
# GitHub Actions での実行イメージ
- name: Run E2E Tests
  run: npx playwright test
  env:
    BASE_URL: http://localhost:3000

- name: Upload Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

### リトライ戦略

- CI 環境: 最大2回リトライ（ネットワーク起因のフレーク対策）
- ローカル: リトライなし（即座にフィードバック）

## セットアップ

```bash
cd 06-e2e-testing
npm install
npx playwright install
```

## テスト実行

```bash
# 全テスト実行
npx playwright test

# UI モードで実行（デバッグ用）
npx playwright test --ui

# 特定テストファイルのみ
npx playwright test tests/auth.spec.ts

# レポート表示
npx playwright show-report
```

## Author

Masato Kikukawa — E2E テスト設計・自動化の実践例
