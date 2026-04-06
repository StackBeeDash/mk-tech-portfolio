# Multi-Agent Decision System

5つの専門エージェントが並列で分析・議論し、包括的な意思決定支援を行うシステム。

## Why -- なぜこの設計にしたか

LLM を単体で使うと、1つの視点に偏った回答になりがちである。人間の意思決定プロセスと同様に、複数の専門家が異なる角度から分析し、それを統合することで、より質の高い判断が得られる。

本システムでは以下の設計判断を行った:

1. **5エージェント構成**: 分析・調査・批判・統合・報告の5つの役割を分離し、各エージェントが自分の専門領域に集中できるようにした
2. **Phase ベースの実行**: Phase 1 で3エージェントを並列実行（レイテンシ削減）、Phase 2-3 で逐次統合（依存関係の尊重）
3. **Zod によるスキーマ検証**: エージェント間のデータ受け渡しを型安全にし、ランタイムエラーを防止
4. **信頼度スコア**: 各エージェントの回答に信頼度を付与し、統合時の重み付けに活用

## Architecture

```
                    ┌─────────────┐
                    │ Orchestrator│
                    └──────┬──────┘
                           │
              Phase 1 (並列実行)
            ┌──────────┼──────────┐
            ▼          ▼          ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Analyst  │ │Researcher│ │  Critic  │
      └────┬─────┘ └────┬─────┘ └────┬─────┘
           │             │             │
           └──────────┬──┘─────────────┘
                      ▼
              Phase 2 (統合)
            ┌──────────────┐
            │ Synthesizer  │
            └──────┬───────┘
                   ▼
              Phase 3 (報告)
            ┌──────────────┐
            │   Reporter   │
            └──────────────┘
```

## Agent Roles

| Agent | Role | Temperature | Purpose |
|-------|------|-------------|---------|
| Analyst | 構造分析 | 0.5 | トピックを分解し、分析フレームワークを提供 |
| Researcher | 調査 | 0.6 | データ、事例、ベストプラクティスを収集 |
| Critic | 批判的評価 | 0.8 | 弱点、リスク、代替案を指摘 |
| Synthesizer | 統合 | 0.6 | 複数視点を統合し一貫した見解を構築 |
| Reporter | 報告 | 0.4 | 意思決定者向けの最終レポートを作成 |

Temperature の設計意図:
- Critic は高め (0.8) にすることで、多様な批判的視点を引き出す
- Reporter は低め (0.4) にすることで、安定した構造化された出力を得る

## Directory Structure

```
multi-agent-system/
├── src/
│   ├── orchestrator.ts        # オーケストレーター（エントリポイント）
│   ├── agents/
│   │   ├── base-agent.ts      # 共通基盤クラス
│   │   ├── analyst.ts         # 分析エージェント
│   │   ├── researcher.ts      # 調査エージェント
│   │   ├── critic.ts          # 批判エージェント
│   │   ├── synthesizer.ts     # 統合エージェント
│   │   ├── reporter.ts        # 報告エージェント
│   │   └── index.ts           # エクスポート
│   └── schemas/
│       └── agent.ts           # Zod バリデーションスキーマ
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
export ANTHROPIC_API_KEY="your-api-key-here"

# 実行
npx tsx src/orchestrator.ts "Should we migrate from REST to GraphQL?"

# コンテキスト付きで実行
npx tsx src/orchestrator.ts "Should we adopt microservices?" "Current: monolithic Django app, 50k DAU, team of 8"
```

## Output Example

```
============================================================
Multi-Agent Analysis: Should we migrate from REST to GraphQL?
============================================================

Phase 1: Parallel analysis (Analyst + Researcher + Critic)...
  [analyst] Starting...
  [analyst] Done (2340ms, confidence: 75%)
  [researcher] Starting...
  [researcher] Done (2180ms, confidence: 80%)
  [critic] Starting...
  [critic] Done (2520ms, confidence: 70%)

Phase 2: Synthesis...
  [synthesizer] Done (1890ms, confidence: 78%)

Phase 3: Final report...
  [reporter] Done (2100ms, confidence: 85%)

============================================================
Orchestration Complete
============================================================
Topic: Should we migrate from REST to GraphQL?
Total duration: 6850ms
Agents used: 5
Average confidence: 78%
```

## Extending

新しいエージェントを追加するには:

1. `BaseAgent` を継承した新しいクラスを `src/agents/` に作成
2. `parseResponse` メソッドを実装
3. `index.ts` にエクスポートを追加
4. `orchestrator.ts` の適切な Phase に組み込む

## Key Design Decisions

- **BaseAgent 抽象クラス**: 共通ロジック（API コール、信頼度推定、findings 抽出）を一箇所にまとめ、各エージェントは systemPrompt と parseResponse のみ定義すればよい
- **Promise.all による並列実行**: Phase 1 の3エージェントは互いに依存しないため、並列実行でレイテンシを 1/3 に削減
- **信頼度のヒューリスティック推定**: 明示的な信頼度がない場合でも、ヘッジング表現の有無から信頼度を推定するシンプルなアプローチを採用
