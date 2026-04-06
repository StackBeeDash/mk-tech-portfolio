# Claude Code セットアップガイド

非技術者でも迷わずに Claude Code を使い始められる、段階的なセットアップガイド。

## Prerequisites

- macOS, Windows, or Linux のいずれか
- ターミナル（コマンドライン）の基本操作ができること
- Anthropic アカウント（Claude Pro / Team / Enterprise プラン）

## Step 1: Node.js のインストール

Claude Code は Node.js 上で動作する。まず Node.js をインストールする。

### macOS

```bash
# Homebrew でインストール（推奨）
brew install node

# バージョン確認
node --version  # v20 以上であること
npm --version
```

### Windows

1. [Node.js 公式サイト](https://nodejs.org/) から LTS 版をダウンロード
2. インストーラーを実行
3. PowerShell を開いて確認:
```powershell
node --version
npm --version
```

## Step 2: Claude Code のインストール

```bash
# グローバルインストール
npm install -g @anthropic-ai/claude-code

# バージョン確認
claude --version
```

## Step 3: 認証

```bash
# 初回起動時に認証が求められる
claude

# ブラウザが開くので、Anthropic アカウントでログイン
# 認証が完了すると、ターミナルに戻る
```

## Step 4: 初めての利用

### 基本的な使い方

```bash
# プロジェクトディレクトリに移動
cd ~/my-project

# Claude Code を起動
claude

# 対話モードで質問する
> このプロジェクトの構成を説明して
> README.md を日本語で作成して
> この CSV ファイルの売上データを月別に集計するスクリプトを作って
```

### よく使うコマンド

| コマンド | 説明 |
|----------|------|
| `claude` | 対話モードで起動 |
| `claude "質問"` | ワンショットで質問 |
| `claude -c` | 前回の会話を継続 |
| `/help` | ヘルプを表示 |
| `/clear` | 会話をリセット |
| `Ctrl+C` | 実行中の処理を中断 |
| `Esc` (2回) | Claude Code を終了 |

## Step 5: プロジェクトの設定（任意）

### CLAUDE.md の作成

プロジェクトのルートに `CLAUDE.md` を作成すると、Claude Code がプロジェクトの文脈を理解して回答の質が向上する。

```markdown
# プロジェクト概要
営業部門の月次レポート自動生成ツール

## データソース
- sales_data.csv: 日別の売上データ
- customers.csv: 顧客マスタ

## ルール
- 金額は日本円で、カンマ区切りで表示する
- グラフは matplotlib で作成する
- 出力は PDF 形式にする
```

### MCP サーバーの追加（上級者向け）

外部ツール（Google Drive, Slack 等）と連携する場合:

```bash
# 例: Slack MCP サーバーの追加
claude mcp add slack

# 登録されたサーバーの確認
claude mcp list
```

## トラブルシューティング

### Q: `command not found: claude` と表示される
Node.js のグローバルインストールパスが PATH に含まれていない可能性がある。

```bash
# npm のグローバルパスを確認
npm config get prefix

# PATH に追加（.zshrc または .bashrc に追記）
export PATH="$(npm config get prefix)/bin:$PATH"
```

### Q: 認証がうまくいかない
```bash
# 認証情報をリセット
claude auth logout
claude auth login
```

### Q: レスポンスが遅い
- インターネット接続を確認する
- Claude のステータスページ (status.anthropic.com) を確認する
- ファイルが大きすぎる場合は、対象を絞って質問する

### Q: 意図しない変更が行われた
```bash
# Git で変更を元に戻す
git diff          # 変更内容を確認
git checkout .    # 全ての変更を取り消し
```

## Next Steps

- [ユースケース集](use-cases.md) で具体的な活用方法を確認
- [業務自動化サンプル](../business-automation/) を実際に動かしてみる
- チームメンバーと共有し、フィードバックを集める
