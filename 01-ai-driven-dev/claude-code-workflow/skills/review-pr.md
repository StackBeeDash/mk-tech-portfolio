# Skill: review-pr

## Purpose
Pull Request のコードレビューを実施し、改善提案を行う。

## Trigger
ユーザーが `/review-pr <PR番号>` と入力したとき。

## Workflow

### Step 1: PR 情報の取得
- `gh pr view <number>` で PR の概要を確認
- `gh pr diff <number>` で変更差分を取得
- 関連 Issue のコンテキストを確認

### Step 2: レビュー観点
以下の観点でコードを確認する:

#### 正確性
- ロジックに誤りがないか
- エッジケースが考慮されているか
- 型安全性が担保されているか

#### セキュリティ
- 入力バリデーションが適切か
- 機密情報がハードコードされていないか
- SQL インジェクション等の脆弱性がないか

#### パフォーマンス
- 不要な再レンダリングがないか
- N+1 クエリが発生していないか
- 適切なキャッシュ戦略が使われているか

#### 保守性
- コードが読みやすいか
- 適切な抽象化レベルか
- テストが十分か

### Step 3: フィードバック
```markdown
## PR レビュー: #XX

### Summary
全体的に良い実装です。2点の改善提案があります。

### Must Fix
- [ ] `src/auth.ts:42` — パスワードのハッシュ化に bcrypt ではなく md5 が使われています

### Suggestions
- `src/api/users.ts:15` — N+1 クエリを DataLoader で解決できます
- `src/components/Form.tsx:28` — useMemo で再計算を防げます

### Nitpicks
- 変数名 `d` → `data` にすると可読性が上がります
```

## Notes
- Must Fix は必ず修正を求める（セキュリティ、バグ）
- Suggestions は推奨だが必須ではない
- Nitpicks はスタイルの好みレベル
