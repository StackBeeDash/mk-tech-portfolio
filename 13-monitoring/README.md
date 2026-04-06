# 13: Monitoring - Datadog によるオブザーバビリティ戦略

Datadog を中心としたオブザーバビリティ基盤の設計と実装サンプルです。

## Why この設計にしたか

### 1. なぜ Datadog を選んだか

| ツール | 強み | 弱み | 今回の判断 |
|--------|------|------|------------|
| **Datadog** | Metrics/Logs/Traces が統合、セットアップが容易、SLO 管理が組み込み | コストが高い（ホスト課金 + ログ量課金） | **採用** |
| Grafana + Prometheus | OSS で柔軟、コスト制御しやすい | 運用負荷が高い（自前ホスティング、ストレージ管理） | 見送り |
| New Relic | APM が強力、Full-Stack Observability | ユーザー課金モデルが組織拡大時に不利 | 見送り |
| CloudWatch | AWS ネイティブ、追加導入不要 | マルチクラウド非対応、ダッシュボードの表現力が弱い | 見送り |

**選定理由:**
- **統合プラットフォーム**: Metrics, Logs, Traces を 1 つの UI で横断的に分析できる。障害調査時にメトリクスからトレース、トレースからログへシームレスに遷移でき、MTTR（平均復旧時間）を短縮できる
- **SLO の組み込みサポート**: Error Budget の自動計算とバーンレートアラートが標準機能として提供される
- **運用負荷の最小化**: SaaS であるため、モニタリング基盤自体の運用が不要。少人数チームでは「モニタリング基盤を監視する」コストを払えない

### 2. オブザーバビリティの 3 本柱

```
┌─────────────────────────────────────────────────┐
│                  Datadog Platform                │
│                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │  Metrics   │  │   Logs    │  │  Traces   │   │
│  │           │  │           │  │           │   │
│  │ DogStatsD │  │ Structured│  │  dd-trace │   │
│  │ custom    │  │ JSON logs │  │  APM      │   │
│  │ metrics   │  │ w/ trace  │  │  auto +   │   │
│  │           │  │ context   │  │  custom   │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │              │              │          │
│        └──────────────┼──────────────┘          │
│                       │                          │
│              Unified Correlation                │
│         (trace_id でログとトレースを紐付け)       │
└─────────────────────────────────────────────────┘
```

#### Metrics（メトリクス）
- **インフラメトリクス**: CPU、メモリ、ディスク、ネットワーク（Datadog Agent が自動収集）
- **アプリケーションメトリクス**: リクエスト数、エラー率、レイテンシ分布（APM が自動生成）
- **ビジネスメトリクス**: カスタムメトリクスとして DogStatsD 経由で送信（`custom-metrics.ts`）

#### Logs（ログ）
- JSON 構造化ログを採用し、Datadog のログパイプラインでパース（`structured-logger.ts`）
- `dd.trace_id` / `dd.span_id` を自動付与し、トレースとの紐付けを実現
- PII（個人情報）はログパイプラインでマスキング（`log-pipeline.yaml`）

#### Traces（トレース）
- `dd-trace` による自動計装で HTTP リクエスト、DB クエリ、外部 API 呼び出しを追跡（`instrumentation.ts`）
- カスタムスパンでビジネスロジックの処理時間を可視化
- サービス間のトレース伝播で分散システムのリクエストフローを追跡

### 3. SLI/SLO の定義方法

**SLI（Service Level Indicator）** はユーザー体験を反映する指標を選定する:

| SLI | 測定方法 | 目標値 |
|-----|----------|--------|
| 可用性 | 成功レスポンス数 / 総リクエスト数 | 99.9% |
| レイテンシ | P99 レスポンスタイム | < 500ms |
| エラー率 | 5xx レスポンス数 / 総リクエスト数 | < 0.1% |

**SLO（Service Level Objective）** は 30 日ローリングウィンドウで評価する:
- Error Budget = 1 - SLO 目標値（例: 99.9% の SLO なら 0.1% = 月間約 43 分のダウンタイム許容）
- Error Budget の消費率が高速な場合、バーンレートアラートで早期検知（`slo-tracking.json`）

### 4. アラート設計（ノイズを減らす戦略）

アラート疲れ（Alert Fatigue）を防ぐための設計原則:

1. **3 段階のセベリティ**: Critical（即時対応）、Warning（営業時間内対応）、Info（参考情報）
2. **最小評価期間**: 瞬間的なスパイクで発火しないよう、5 分以上の評価ウィンドウを設定
3. **Recovery Threshold**: アラート解除にも閾値を設け、フラッピング（発火→解除の繰り返し）を防止
4. **エスカレーション**: Critical は PagerDuty → Slack、Warning は Slack のみ、Info はダッシュボードのみ
5. **アラートの定期棚卸し**: 月次で「過去 30 日間一度も Acknowledge されなかったアラート」を見直す

### 5. コスト最適化の考え方

Datadog はホスト数・ログ量・カスタムメトリクス数で課金されるため、コスト管理が重要:

| 対策 | 効果 |
|------|------|
| ログのサンプリング（DEBUG レベルは 10% のみ送信） | ログインデックス量を削減 |
| カスタムメトリクスの集約（Distribution Metrics） | メトリクス数を抑制 |
| 不要タグの除外（Metrics without Limits） | カーディナリティ爆発を防止 |
| ログの Exclusion Filter | ヘルスチェック等の低価値ログを除外 |
| APM のサンプリングレート調整 | トレース量をコントロール |

## ディレクトリ構成

```
13-monitoring/
├── README.md                        # 本ファイル
├── package.json                     # 依存関係
├── tsconfig.json                    # TypeScript 設定
├── dashboards/
│   ├── service-overview.json        # サービスヘルス ダッシュボード
│   └── slo-tracking.json            # SLO トラッキング ダッシュボード
├── alerts/
│   └── alert-rules.yaml             # アラートルール定義
├── apm/
│   ├── instrumentation.ts           # APM 計装（dd-trace）
│   └── custom-metrics.ts            # カスタムメトリクス（DogStatsD）
└── logs/
    ├── structured-logger.ts         # 構造化ログ実装
    └── log-pipeline.yaml            # ログパイプライン設定
```

## セットアップ

```bash
cd 13-monitoring
npm install
```

### 環境変数

```bash
# Datadog Agent が localhost:8126 (APM) / localhost:8125 (DogStatsD) で動作している前提
export DD_SERVICE=my-service
export DD_ENV=production
export DD_VERSION=1.0.0
export DD_AGENT_HOST=localhost
export LOG_LEVEL=info
```

## 参考資料

- [Datadog APM - Node.js](https://docs.datadoghq.com/tracing/setup_overview/setup/nodejs/)
- [DogStatsD - Node.js Client](https://docs.datadoghq.com/developers/dogstatsd/?tab=nodejs)
- [Datadog SLO Management](https://docs.datadoghq.com/service_management/service_level_objectives/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
