# mk-tech-portfolio

**菊川 正人** の技術ポートフォリオ — AI 駆動開発、クラウドアーキテクチャ、エンジニアリングリーダーシップの実践を示すリポジトリです。

## 概要

実際のプライベートプロジェクトから技術エッセンスを抽出し、フルスタックエンジニアリング、AI 駆動開発、CTO レベルのアーキテクチャ意思決定を示します。

> **設計判断の記録**: 各テーマには、技術選定の意思決定プロセスを記録した [Discussions](https://github.com/StackBeeDash/mk-tech-portfolio/discussions/categories/ideas) があります。「なぜその技術・パターンを選んだか」を ADR（Architecture Decision Records）形式で残しています。

## ポートフォリオ

| # | テーマ | ディレクトリ | 設計判断 |
|---|--------|-------------|----------|
| 01 | AI 駆動開発 | [`01-ai-driven-dev/`](01-ai-driven-dev/) | [マルチエージェント Phase 戦略](../../discussions/38) / [MCP トランスポート選択](../../discussions/46) |
| 02 | クラウドアーキテクチャ | [`02-cloud-architecture/`](02-cloud-architecture/) | [Cloud Run Jobs vs Service](../../discussions/39) |
| 03 | 技術トレーニング | [`03-training-content/`](03-training-content/) | ハンズオンラボ & AI コース生成 |
| 04 | 非エンジニア向け Claude Code | [`04-claude-for-non-engineers/`](04-claude-for-non-engineers/) | [組織への AI 導入戦略](../../discussions/49) |
| 05 | ドメイン駆動設計 (DDD) | [`05-ddd/`](05-ddd/) | [DDD をいつ適用するか](../../discussions/41) |
| 06 | E2E テスト自動化 | [`06-e2e-testing/`](06-e2e-testing/) | [Playwright + Page Object パターン](../../discussions/43) |
| 07 | Figma → UI 開発 | [`07-figma-to-code/`](07-figma-to-code/) | [CSS Custom Properties vs CSS-in-JS](../../discussions/44) |
| 08 | CI/CD パイプライン | [`08-ci-cd-pipeline/`](08-ci-cd-pipeline/) | [Workload Identity Federation](../../discussions/45) |
| 09 | モノレポ設計 | [`09-monorepo-design/`](09-monorepo-design/) | [モノレポ vs マルチリポ](../../discussions/42) |
| 10 | DB 設計 / マイグレーション | [`10-db-migration/`](10-db-migration/) | [RLS vs アプリ層テナント分離](../../discussions/40) |
| 11 | セキュリティ | [`11-security/`](11-security/) | [Supabase Auth 選定](../../discussions/48) / [RLS 戦略](../../discussions/40) |
| 12 | API 設計 | [`12-api-design/`](12-api-design/) | [FastAPI vs Hono vs Express](../../discussions/47) |
| 13 | モニタリング | [`13-monitoring/`](13-monitoring/) | [Datadog vs Grafana + Prometheus](../../discussions/50) |
| 14 | ロードテスト | [`14-load-testing/`](14-load-testing/) | [Azure Load Testing + JMeter vs k6](../../discussions/51) |

## 設計判断一覧 (ADR)

このポートフォリオは「何を作ったか」だけでなく「なぜその判断をしたか」を重視しています。全ての ADR は **背景 → 選択肢 → 決定 → トレードオフ** の構造で記載しています。

| ADR | 判断内容 | テーマ |
|-----|---------|--------|
| [ADR-001](../../discussions/38) | マルチエージェント実行: Phase ベースの並列化 | 01 AI |
| [ADR-002](../../discussions/39) | Cloud Run Jobs を Service + Scheduler より優先 | 02 Cloud |
| [ADR-003](../../discussions/40) | RLS をアプリ層テナント分離より優先 | 10 DB / 11 Security |
| [ADR-004](../../discussions/41) | DDD をいつ（そしていつでも）適用するか | 05 DDD |
| [ADR-005](../../discussions/42) | Turborepo + pnpm を Nx / マルチリポより優先 | 09 Monorepo |
| [ADR-006](../../discussions/43) | Playwright + Page Object を Cypress より優先 | 06 E2E |
| [ADR-007](../../discussions/44) | CSS Custom Properties を CSS-in-JS より優先 | 07 Figma |
| [ADR-008](../../discussions/45) | Workload Identity Federation を SA キーより優先 | 08 CI/CD |
| [ADR-009](../../discussions/46) | MCP stdio トランスポートを HTTP より優先 | 01 AI |
| [ADR-010](../../discussions/47) | コンテキストに応じたフレームワーク選定 (FastAPI / Hono) | 12 API |
| [ADR-011](../../discussions/48) | Supabase Auth を Auth0 / 自前実装より優先 | 11 Security |
| [ADR-012](../../discussions/49) | 非エンジニアへの段階的 AI 導入 | 04 Claude |
| [ADR-013](../../discussions/50) | Datadog を Grafana + Prometheus / CloudWatch より優先 | 13 Monitoring |
| [ADR-014](../../discussions/51) | Azure Load Testing + JMeter を k6 と併用 | 14 Load Testing |

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| AI / LLM | Claude API, Claude Code, MCP (Model Context Protocol) |
| フロントエンド | Next.js, React, Nuxt 3, TypeScript |
| バックエンド | FastAPI, Python, Node.js |
| クラウド | GCP (Cloud Run Jobs, Cloud Storage), Supabase |
| デスクトップ | Tauri (Rust) |
| テスト | Playwright, Vitest, JMeter, k6 |
| ロードテスト | Azure Load Testing, JMeter, k6 |
| デザイン | Figma, Figma MCP |
| モニタリング | Datadog (APM, Logs, Metrics), DogStatsD, pino |
| DevOps | GitHub Actions, Docker, Turborepo |

## 著者

**菊川 正人 (Masato Kikukawa)**
- IT 業界 20 年以上 — クラウドアーキテクチャ、AI 駆動開発、技術トレーニング
- 元 Microsoft Certified Trainer (2021-2025)
- Azure & GCP 認定資格保持 (AZ-104, AZ-305, DP-203 等)

## ライセンス

MIT
