# MCP Server Integration

Model Context Protocol (MCP) サーバーの実装サンプル。Claude Code にプロジェクト固有のツールとリソースを提供する。

## Why -- なぜこの設計にしたか

Claude Code は強力だが、プロジェクト固有のコンテキストを持っていない。MCP サーバーを構築することで、以下を実現する:

1. **プロジェクト知識の外部化**: アーキテクチャ、規約、統計情報を MCP リソースとして公開し、Claude Code が常に最新の情報を参照できるようにする
2. **カスタムツールの提供**: セマンティック検索やプロジェクト統計など、プロジェクト固有の操作を Claude Code に提供する
3. **stdio トランスポート**: ローカル開発で最もシンプルな接続方式を採用。セキュリティリスクが低く、セットアップが容易

### MCP の概要

Model Context Protocol (MCP) は、LLM アプリケーションに外部データソースやツールを統合するためのオープンプロトコルである。

```
┌─────────────────┐     stdio/SSE     ┌─────────────────┐
│   Claude Code   │ ◄──────────────► │   MCP Server    │
│   (MCP Client)  │                   │ (project-assist)│
└─────────────────┘                   └────────┬────────┘
                                               │
                                      ┌────────┴────────┐
                                      │                  │
                                 ┌────▼───┐      ┌──────▼──────┐
                                 │  Tools │      │  Resources  │
                                 └────────┘      └─────────────┘
```

主要な概念:
- **Tools**: LLM が呼び出せる関数（検索、データ取得、操作の実行）
- **Resources**: LLM が参照できる読み取り専用データ（ドキュメント、設定、統計）
- **Prompts**: 事前定義されたプロンプトテンプレート

## Directory Structure

```
mcp-integration/
├── src/
│   ├── server.ts              # MCP サーバーエントリポイント
│   ├── tools/
│   │   ├── semantic-search.ts # セマンティック検索ツール
│   │   └── project-stats.ts   # プロジェクト統計ツール
│   └── resources/
│       └── project-context.ts # プロジェクトコンテキストリソース
├── package.json
├── tsconfig.json
└── README.md
```

## Tools

### semantic_search
プロジェクトのドキュメントを自然言語で検索する。

```json
{
  "query": "How does authentication work?",
  "maxResults": 3,
  "tags": ["auth", "security"]
}
```

デモ実装では TF-IDF 風のテキスト類似度を使用。本番環境では:
- OpenAI Embeddings + Pinecone
- Cohere Embed + Qdrant
- pgvector (PostgreSQL)
等のベクトル検索に置き換える。

### project_stats
プロジェクトの統計情報（コミット数、Issue 数、PR 数、デプロイ数）を返す。

```json
{
  "period": "month",
  "category": "all"
}
```

デモ実装ではモックデータを返す。本番環境では GitHub API や CI/CD プロバイダの API から取得する。

## Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Architecture Overview | `project://architecture/overview` | システムアーキテクチャの概要 |
| Tech Stack | `project://tech-stack` | 使用技術とバージョン一覧 |
| Coding Conventions | `project://conventions/coding` | コーディング規約 |

## Usage

### Claude Code への登録

```bash
# MCP サーバーをインストール
cd mcp-integration && npm install && npm run build

# Claude Code に登録（stdio トランスポート）
claude mcp add-json project-assistant '{
  "type": "stdio",
  "command": "node",
  "args": ["path/to/mcp-integration/dist/server.js"]
}' -s project

# Bun で直接実行する場合
claude mcp add-json project-assistant '{
  "type": "stdio",
  "command": "bun",
  "args": ["run", "path/to/mcp-integration/src/server.ts"]
}' -s project
```

### 動作確認

```bash
# サーバーが正しく起動するか確認
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/server.js

# Claude Code で確認
claude mcp list  # project-assistant が表示されることを確認
```

## Design Decisions

1. **McpServer (High-level API) の採用**: `@modelcontextprotocol/sdk` の McpServer クラスを使用。低レベル API (`Server`) よりも記述量が少なく、型安全性が高い

2. **Zod によるスキーマ定義**: ツールの入力バリデーションに Zod を使用。MCP SDK が Zod スキーマを JSON Schema に自動変換してくれる

3. **リソースの静的定義**: デモではハードコードだが、本番では Git リポジトリやデータベースから動的に読み込む設計に拡張できる

4. **stdio トランスポート**: ローカル開発ではシンプルで安全。リモートアクセスが必要な場合は SSE (Server-Sent Events) トランスポートに切り替える

## Extending

新しいツールを追加するには:

1. `src/tools/` に新しいファイルを作成
2. Zod スキーマで入力を定義
3. `server.ts` で `server.tool()` を呼び出してツールを登録

新しいリソースを追加するには:

1. `src/resources/project-context.ts` にリソースオブジェクトを追加
2. `allResources` 配列に追加（自動的に登録される）
