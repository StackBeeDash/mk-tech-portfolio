# 14: Load Testing - ロードテスト戦略 & 実践

Azure Load Testing を中心としたロードテスト戦略と、JMeter / k6 による実践的なテストプランです。

## Why この設計にしたか

### 1. Azure Load Testing を選択した理由

| ツール | 特徴 | 今回の判断 |
|--------|------|------------|
| Azure Load Testing | クラウド JMeter、Azure 統合、CI/CD 連携が容易 | **採用（メイン）** |
| k6 | JavaScript ベース、軽量、開発者フレンドリー | **採用（補助・ローカル検証用）** |
| Gatling | Scala/Java ベース、高パフォーマンス | 見送り（学習コスト） |
| Locust | Python ベース、分散テスト | 見送り（エンタープライズ機能不足） |

**Azure Load Testing を選んだ理由:**

1. **既存 JMeter 資産の活用**: JMeter テストプランをそのままクラウドで実行でき、移行コストがゼロ
2. **Azure エコシステムとの統合**: Application Insights / Azure Monitor との連携でサーバーサイドメトリクスとクライアントサイドメトリクスを一元管理
3. **スケーラビリティ**: エンジンインスタンスを増やすだけで数千〜数万 VU の負荷を生成可能
4. **CI/CD ネイティブ**: GitHub Actions / Azure DevOps から直接実行でき、Pass/Fail 判定を自動化可能

**k6 を補助的に採用した理由:**

- ローカル開発時の軽量な負荷テストに適している
- JavaScript でシナリオを書けるため、開発者が取り組みやすい
- Azure Load Testing に投入する前の事前検証として有用

### 2. テスト種別の使い分け

| テスト種別 | 目的 | VU パターン | 実行タイミング |
|-----------|------|-------------|----------------|
| **Load Test** | 通常負荷での性能確認 | 段階的増加 → 定常 → 段階的減少 | CI/CD（毎リリース） |
| **Stress Test** | 限界点（ブレークポイント）の特定 | 段階的に限界まで増加 | スプリント末 or 月次 |
| **Spike Test** | 急激な負荷変動への耐性確認 | 急増 → 急減を繰り返し | 大規模イベント前 |
| **Soak Test** | 長時間稼働での安定性確認（メモリリーク等） | 定常負荷を長時間維持 | リリース前（数時間） |

### 3. CI/CD への統合戦略

```
PR 作成 → ビルド → デプロイ(Staging) → Load Test → 結果評価 → マージ判定
                                            ↓
                                    Azure Load Testing
                                    (クラウド JMeter 実行)
                                            ↓
                                    Pass/Fail 自動判定
                                    → PR コメントに結果投稿
```

**統合のポイント:**

- **ステージング環境のみ**: 本番環境への負荷テストは原則禁止（例外: カナリアリリース時）
- **自動 Pass/Fail**: SLA ベースの閾値で自動判定し、人手の介入を最小化
- **コスト制御**: PR ごとに軽量テスト、main マージ時にフルテストを実行

### 4. テスト結果の評価基準（SLA ベース）

| メトリクス | 閾値（Load Test） | 閾値（Stress Test） | 測定方法 |
|-----------|-------------------|---------------------|----------|
| P95 レスポンスタイム | < 500ms | < 2000ms | JMeter Aggregate Report |
| P99 レスポンスタイム | < 1000ms | < 5000ms | JMeter Aggregate Report |
| エラー率 | < 1% | < 5% | HTTP ステータスコード 4xx/5xx |
| スループット | > 100 req/s | 測定のみ | リクエスト数 / 実行時間 |
| CPU 使用率 | < 70% | 測定のみ | Azure Monitor |
| メモリ使用率 | < 80% | 測定のみ | Azure Monitor |

### 5. コスト最適化

**Azure Load Testing の課金モデル:**

| 項目 | 料金（目安） | 最適化方法 |
|------|-------------|------------|
| VUH（Virtual User Hours） | 従量課金 | テスト時間を最小限に設定 |
| エンジンインスタンス | インスタンス数 x 実行時間 | PR テストは 1 インスタンス、本番前のみスケールアウト |
| データ転送 | 送受信量に応じた課金 | レスポンスボディの検証は最小限に |

**節約のベストプラクティス:**

1. **段階的テスト**: ローカル k6 → Azure Load Testing（小規模）→ Azure Load Testing（フル）
2. **スケジュール実行**: 夜間・週末にフルテストを実行（開発時間帯を避ける）
3. **テスト時間の最適化**: Ramp-up と Steady State を必要最小限に設定
4. **結果キャッシュ**: 変更がないコンポーネントは再テスト不要

## ディレクトリ構成

```
14-load-testing/
├── README.md                          # 本ドキュメント
├── jmeter/
│   ├── test-plans/
│   │   ├── api-load-test.jmx         # API 負荷テストプラン
│   │   └── stress-test.jmx           # ストレステストプラン
│   └── test-data/
│       ├── users.csv                  # テスト用ユーザーデータ
│       └── items.csv                  # テスト用アイテムデータ
├── azure-load-testing/
│   ├── load-test-config.yaml          # Azure Load Testing 設定
│   └── ci-integration.yml             # GitHub Actions ワークフロー
├── k6/
│   └── scripts/
│       ├── load-test.js               # k6 ロードテスト
│       └── stress-test.js             # k6 ストレステスト
└── scripts/
    ├── analyze-results.py             # 結果分析スクリプト
    └── requirements.txt               # Python 依存パッケージ
```

## ローカルでの実行方法

### JMeter（GUI モード — テスト作成・デバッグ用）

```bash
jmeter -t jmeter/test-plans/api-load-test.jmx
```

### JMeter（CLI モード — テスト実行用）

```bash
jmeter -n -t jmeter/test-plans/api-load-test.jmx \
  -Jtarget.host=localhost -Jtarget.port=8080 \
  -l results/result.csv -e -o results/report/
```

### k6

```bash
k6 run k6/scripts/load-test.js --env BASE_URL=http://localhost:8080
```

### 結果分析

```bash
pip install -r scripts/requirements.txt
python scripts/analyze-results.py results/result.csv --output report.md
```
