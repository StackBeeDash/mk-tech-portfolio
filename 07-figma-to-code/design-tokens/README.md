# Design Tokens — トークン設計の考え方

## なぜデザイントークンが必要か（Why）

デザイントークンは、デザインの意思決定を**名前付きの値**として定義したものです。

### トークンがない場合の問題

```css
/* 悪い例: マジックナンバーの散在 */
.button { background: #2563eb; padding: 8px 16px; }
.card   { border: 1px solid #e5e7eb; padding: 24px; }
.badge  { background: #16a34a; padding: 4px 8px; }
```

- `#2563eb` は何を意味するか？ Primary? Brand? Link?
- `8px` と `4px` と `24px` はどういう関係？
- ブランドカラーを変更したい場合、全ファイルを検索・置換？

### トークンがある場合

```css
/* 良い例: 意図が明確 */
.button { background: var(--color-primary); padding: var(--spacing-2) var(--spacing-4); }
.card   { border: 1px solid var(--color-border); padding: var(--spacing-6); }
.badge  { background: var(--color-success); padding: var(--spacing-1) var(--spacing-2); }
```

## トークンの階層設計

本プロジェクトでは3層構造を採用しています:

```
Primitive Tokens (生の値)
  └── --color-blue-600: #2563eb

Semantic Tokens (意味付き)
  └── --color-primary: var(--color-blue-600)

Component Tokens (コンポーネント固有) ※今回は CSS 内で直接参照
  └── .button { background: var(--color-primary) }
```

### なぜ3層か

1. **Primitive**: 全色パレットを網羅。デザイナーが管理
2. **Semantic**: 用途を表現。ダークモード対応の切り替えポイント
3. **Component**: コンポーネント固有。Primitive/Semantic の組み合わせ

## カテゴリ

| カテゴリ | 例 | 用途 |
|---------|-----|------|
| Color | `--color-primary`, `--color-text-primary` | ブランド、テキスト、背景、ボーダー |
| Spacing | `--spacing-1` ~ `--spacing-16` | 余白、パディング |
| Typography | `--font-size-sm`, `--font-weight-bold` | フォントサイズ、ウェイト、行間 |
| Shadow | `--shadow-sm`, `--shadow-lg` | ボックスシャドウ |
| Border Radius | `--radius-sm`, `--radius-full` | 角丸 |

## ダークモード対応

CSS Custom Properties の利点を活かし、`prefers-color-scheme` でトークン値を切り替えます:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #111827;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #111827;
    --color-text-primary: #f9fafb;
  }
}
```

## Figma との対応

Figma のスタイル/変数とトークンを1:1で対応させることで、デザインとコードの同期を保ちます:

| Figma Variable | CSS Token |
|---------------|-----------|
| `Colors/Primary` | `--color-primary` |
| `Spacing/4` | `--spacing-4` |
| `Radius/Medium` | `--radius-md` |
