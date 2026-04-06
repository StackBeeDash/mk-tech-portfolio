# Cloud Run Jobs データパイプライン

FastAPI + Cloud Run Jobs によるバッチ ETL パイプラインのデモ実装。

## Why この設計にしたか

### Cloud Run Jobs を選んだ理由

- **コスト効率**: バッチ実行時のみ課金される。常時稼働の VM と比べてコストが桁違いに安い
- **スケーラビリティ**: タスク並列度を設定するだけで水平スケール可能
- **運用負荷の低減**: インフラ管理不要。コンテナを渡すだけでジョブが走る
- **Cloud Scheduler との統合**: Cron 式でスケジュール実行が可能

### ETL の3段階分離

Extract / Transform / Load を明確に分離した理由:

1. **障害の局所化**: どの段階で失敗したかが即座に分かる
2. **リトライの粒度制御**: Load だけ失敗した場合、Transform 結果を再利用できる
3. **テスト容易性**: 各段階を独立してユニットテスト可能

### マルチステージ Docker ビルド

- ビルド時依存をランタイムに持ち込まないことで、イメージサイズを削減
- コールドスタート時間の短縮に直結する

## アーキテクチャ

```mermaid
graph TB
    subgraph "Trigger"
        CS[Cloud Scheduler]
    end

    subgraph "Cloud Run Jobs"
        JOB[Job Execution]
        subgraph "ETL Pipeline"
            E[Extract<br/>外部APIからデータ収集]
            T[Transform<br/>クレンジング・正規化]
            L[Load<br/>宛先テーブルへ書き込み]
        end
    end

    subgraph "External"
        API[Source API]
        DB[(BigQuery /<br/>Supabase)]
    end

    subgraph "Observability"
        LOG[Cloud Logging]
        MON[Cloud Monitoring]
    end

    CS -->|Cron トリガー| JOB
    JOB --> E
    E -->|httpx| API
    E --> T
    T --> L
    L --> DB

    JOB -->|構造化ログ| LOG
    LOG --> MON
```

## パイプラインフロー

```mermaid
sequenceDiagram
    participant CS as Cloud Scheduler
    participant CRJ as Cloud Run Jobs
    participant API as Source API
    participant DB as BigQuery / Supabase

    CS->>CRJ: ジョブ実行トリガー
    activate CRJ

    Note over CRJ: Phase 1: Extract
    CRJ->>API: GET /data (バッチ取得)
    API-->>CRJ: Raw Records

    Note over CRJ: Phase 2: Transform
    CRJ->>CRJ: クレンジング・正規化・バリデーション

    Note over CRJ: Phase 3: Load
    CRJ->>DB: バッチ INSERT
    DB-->>CRJ: OK

    CRJ-->>CS: 完了 (exit code 0)
    deactivate CRJ
```

## ディレクトリ構成

```
data-pipeline/
├── src/
│   ├── main.py          # エントリポイント（FastAPI + CLI）
│   └── pipeline.py      # ETL パイプラインロジック
├── Dockerfile           # マルチステージビルド
├── cloudbuild.yaml      # Cloud Build 設定
├── requirements.txt     # Python 依存関係
└── README.md
```

## ローカル実行

```bash
# 依存関係インストール
pip install -r requirements.txt

# ドライラン（DB書き込みなし）
DRY_RUN=true python src/main.py

# FastAPI サーバーとして起動（デバッグ用）
uvicorn src.main:app --reload --port 8080
```

## デプロイ

```bash
# Cloud Build でビルド & デプロイ
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_PROJECT_ID=your-project-id

# ジョブの手動実行
gcloud run jobs execute data-pipeline --region=asia-northeast1

# スケジュール設定（毎日 AM 3:00 JST）
gcloud scheduler jobs create http data-pipeline-schedule \
  --schedule="0 18 * * *" \
  --uri="https://asia-northeast1-run.googleapis.com/..." \
  --http-method=POST
```

> NOTE: 上記のプロジェクトID・URLはプレースホルダーです。実際の値は非公開です。
