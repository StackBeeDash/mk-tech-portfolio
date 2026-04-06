# 02: Cloud Architecture

GCP を中心としたクラウドアーキテクチャの設計・実装ポートフォリオ。

## Why クラウドアーキテクチャを重視するか

現代のソフトウェア開発において、アーキテクチャの選定はビジネスの成否に直結する。
特に以下の観点で、クラウドネイティブな設計を重視している:

- **コスト最適化**: サーバーレス / コンテナベースで使った分だけ課金
- **スケーラビリティ**: トラフィック変動に自動対応
- **開発速度**: マネージドサービスを活用してインフラ構築時間を削減
- **運用負荷の低減**: フルマネージドサービスの活用

## 収録コンテンツ

### [data-pipeline/](./data-pipeline/) - Cloud Run Jobs データパイプライン

FastAPI + Cloud Run Jobs による ETL バッチパイプライン。
外部 API からデータを収集し、クレンジング・正規化して BigQuery / Supabase にロードする。

- **技術**: FastAPI, Cloud Run Jobs, Cloud Build, Cloud Scheduler
- **ポイント**: マルチステージ Docker ビルド、3段階 ETL 分離、構造化ログ

### [fullstack-saas/](./fullstack-saas/) - フルスタック SaaS アーキテクチャ

Next.js + FastAPI + Supabase による SaaS アプリケーションの設計図。
アーキテクチャ図、シーケンス図、ADR (Architecture Decision Records) を収録。

- **技術**: Next.js (App Router), FastAPI, Supabase (PostgreSQL + RLS)
- **ポイント**: RSC / CC の使い分け、RLS によるアクセス制御、楽観的更新

## 共通する設計思想

1. **サーバーレスファースト**: 可能な限りマネージドサービスを使い、インフラ管理コストを下げる
2. **コンテナ標準**: アプリケーションは全てコンテナ化し、ポータビリティを確保する
3. **可観測性**: 構造化ログ + トレーシング + メトリクスの三本柱で運用を支える
4. **セキュリティバイデザイン**: 最小権限、non-root コンテナ、RLS、Secret Manager の活用
