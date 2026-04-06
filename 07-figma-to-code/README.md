# 07: Figma to Code — デザイントークン & ワークフロー設計

## Overview

Figma のデザインを効率的にコードへ変換するワークフローと、デザインシステムの基盤となるデザイントークン、React コンポーネントの実装を示すポートフォリオです。

## なぜこの設計にしたか（Why）

### Figma → Code ワークフローの課題

従来の「デザイナーが Figma で作り、エンジニアが目視で実装」フローには以下の問題がありました:

1. **デザインとコードの乖離**: 色やスペーシングが微妙にずれる
2. **コミュニケーションコスト**: 「ここの余白は何px？」の確認が頻発
3. **一貫性の欠如**: 同じ概念に異なる値が使われる

### 解決策: デザイントークン + MCP 活用

```
Figma (Single Source of Truth)
  │
  ├── Figma MCP ──→ デザイン情報の自動取得
  │                   (色、スペーシング、タイポグラフィ)
  │
  ├── Design Tokens ──→ CSS Custom Properties
  │                       (tokens.css)
  │
  └── Components ──→ React コンポーネント
                      (トークンを参照して実装)
```

### なぜ CSS Custom Properties を採用したか

| 方式 | メリット | デメリット |
|------|---------|-----------|
| **CSS Custom Properties** | フレームワーク非依存、ランタイムで変更可能 | IE 非対応 |
| Tailwind config | ユーティリティと統合 | Tailwind に依存 |
| JS オブジェクト | 型安全 | CSS から直接参照不可 |
| Sass 変数 | 広くサポート | ランタイム変更不可 |

**決め手**: フレームワークに依存せず、ダークモードなどのテーマ切り替えにも対応しやすい。

### なぜ React + Vite を選んだか

- **Vite**: 高速な HMR でコンポーネント開発の体験が良い
- **React**: コンポーネントベースで再利用性が高く、Figma のコンポーネント概念と1:1で対応しやすい

### MCP（Model Context Protocol）を活用した判断フロー

Figma MCP を使うことで、デザイン情報を AI が自動取得し、コード生成を支援できます。

```
デザイン変更発生
  │
  ├── Figma MCP で変更内容を取得
  │
  ├── 既存トークンで表現可能？
  │   ├── Yes → 既存トークンを使用
  │   └── No  → 新規トークンを追加
  │
  ├── 既存コンポーネントで対応可能？
  │   ├── Yes → variant / props 追加
  │   └── No  → 新規コンポーネント作成
  │
  └── コードレビュー & デザインレビュー
```

## ディレクトリ構成

```
07-figma-to-code/
├── README.md                    # 本ファイル
├── package.json                 # 依存関係
├── tsconfig.json                # TypeScript 設定
├── vite.config.ts               # Vite 設定
├── index.html                   # エントリポイント
├── src/
│   └── main.tsx                 # React マウント
├── design-tokens/
│   ├── README.md                # トークン設計の考え方
│   └── tokens.css               # CSS カスタムプロパティ
├── components/
│   ├── index.ts                 # エクスポート
│   ├── Button.tsx               # ボタンコンポーネント
│   ├── Card.tsx                 # カードコンポーネント
│   ├── Input.tsx                # 入力フィールド
│   └── Badge.tsx                # バッジコンポーネント
└── pages/
    └── index.tsx                # デモページ（ショーケース）
```

## セットアップ

```bash
cd 07-figma-to-code
npm install
npm run dev
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## デザイントークンの使い方

```css
/* トークンを使ったスタイリング */
.my-component {
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

```tsx
// コンポーネントでの使用
<Button variant="primary" size="md">保存</Button>
<Card header="タイトル">コンテンツ</Card>
<Input label="メール" error="入力してください" />
<Badge variant="success">完了</Badge>
```

## Author

Masato Kikukawa — Figma → Code ワークフロー設計の実践例
