# Claude Code Workflow Design

Claude Code を開発チームに導入する際のワークフロー設計パターン集。

## Why — なぜこの設計にしたか

Claude Code は単なるコード生成ツールではなく、開発プロセス全体を支援するエージェントである。しかし、適切な「ルール」と「ワークフロー」を設計しなければ、その能力を最大限に活かせない。

本サンプルでは、以下の3つの設計要素を具体的に示す:

1. **CLAUDE.md** — プロジェクトルールの明文化により、Claude Code が一貫した判断を行えるようにする
2. **Skills** — 繰り返し行う複雑なタスクをスキルとして定義し、再現性を高める
3. **Hooks** — Git のコミットフローに品質チェックを組み込み、自動化する

## Directory Structure

```
claude-code-workflow/
├── CLAUDE.md.example          # プロジェクトルールの設計例
├── skills/
│   ├── decompose-issues.md    # Issue 分解スキル
│   ├── implement-milestone.md # マイルストーン一括実装スキル
│   └── review-pr.md           # PR レビュースキル
├── hooks/
│   ├── pre-commit.sh          # コミット前の品質チェック
│   ├── post-commit.sh         # コミット後の自動化タスク
│   └── commit-msg.sh          # コミットメッセージの検証
└── README.md
```

## CLAUDE.md の設計ポイント

`CLAUDE.md.example` は、実際のプロジェクトで使用する CLAUDE.md のテンプレートである。

### 必須セクション
- **Tech Stack**: 使用技術を明記し、Claude Code が適切な判断をできるようにする
- **Architecture Rules**: アーキテクチャの制約を明記し、一貫性を保つ
- **Coding Standards**: 命名規則やエラーハンドリング方針を統一する
- **Common Commands**: よく使うコマンドを記載し、Claude Code が自律的に実行できるようにする

### 設計判断
- ルールは「宣言的」に書く（手順ではなく制約を記述する）
- 例外を明記する（「〜を除き」「〜の場合は」）
- チーム全体で CLAUDE.md をレビューし、コンセンサスを得る

## Skills の設計ポイント

Skills は Claude Code のカスタムスラッシュコマンドである。

### 設計原則
1. **1スキル = 1ワークフロー**: 複数のタスクを組み合わせた定型フローを1つのスキルにまとめる
2. **トリガーの明確化**: どのような入力でスキルが起動するかを明記する
3. **出力フォーマットの標準化**: 毎回同じ形式で結果を返すことで、予測可能性を高める

### 収録スキル
| スキル | 用途 |
|--------|------|
| `decompose-issues` | 大粒 Issue を実装可能な粒度に分解 |
| `implement-milestone` | マイルストーンの全 Issue を一括実装 |
| `review-pr` | PR のコードレビューを実施 |

## Hooks の設計ポイント

Git Hooks を活用して、コミットの品質を自動的に担保する。

### pre-commit.sh
5段階のチェックを実行:
1. **Secrets Detection** — API キーやパスワードの混入を防止
2. **TypeScript Type Check** — 型エラーを検出
3. **Lint** — ESLint / Ruff によるコーディング規約チェック
4. **Format Check** — Prettier によるフォーマット確認
5. **Related Tests** — 変更ファイルに対応するテストを実行

### post-commit.sh
コミット後の自動化:
- コミットログの記録
- Issue への自動リンク
- CHANGELOG ドラフトの自動生成

### commit-msg.sh
Conventional Commits 形式の検証:
- `feat:`, `fix:`, `docs:` 等のプレフィックスを強制
- タイトル長の警告（72文字以上）

## Usage

```bash
# Hooks のインストール
cp hooks/pre-commit.sh .git/hooks/pre-commit
cp hooks/post-commit.sh .git/hooks/post-commit
cp hooks/commit-msg.sh .git/hooks/commit-msg
chmod +x .git/hooks/pre-commit .git/hooks/post-commit .git/hooks/commit-msg

# CLAUDE.md をプロジェクトに配置
cp CLAUDE.md.example /path/to/your/project/CLAUDE.md
# プロジェクトに合わせて内容を編集

# Skills をプロジェクトに配置
mkdir -p /path/to/your/project/.claude/skills
cp skills/*.md /path/to/your/project/.claude/skills/
```

## Learnings

- CLAUDE.md は「生きたドキュメント」として定期的に更新する
- ルールが多すぎると逆効果になる。20-30 ルールを目安にする
- Hooks は高速に実行されることが重要。遅い場合はキャッシュや並列実行を検討する
- Skills は使いながら改善するもの。最初から完璧を目指さない
