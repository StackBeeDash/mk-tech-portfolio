# ユビキタス言語定義

マーケティング計測プラットフォームにおけるドメイン用語の日英対応表です。

## Why ユビキタス言語を定義するのか

- ビジネス側とエンジニアが同じ言葉でコミュニケーションすることで、認識齟齬を減らす
- コード上の命名がドメインの概念と一致し、可読性・保守性が向上する
- 新メンバーのオンボーディングが加速する

## キャンペーン管理コンテキスト

| 日本語 | English | 定義 | コード上の型名 |
|--------|---------|------|---------------|
| キャンペーン | Campaign | 特定の目的・期間で実施するマーケティング施策の単位 | `Campaign` |
| キャンペーンID | Campaign ID | キャンペーンを一意に識別する値 | `CampaignId` |
| キャンペーン名 | Campaign Name | キャンペーンの表示名称 | `CampaignName` |
| 予算 | Budget | キャンペーンに割り当てられた金額上限 | `Money` |
| 実施期間 | Date Range | キャンペーンの開始日〜終了日 | `DateRange` |
| キャンペーン状態 | Campaign Status | Draft / Active / Paused / Completed の4状態 | `CampaignStatus` |
| 下書き | Draft | 作成中で未公開のキャンペーン | `CampaignStatus.Draft` |
| 有効 | Active | 現在実施中のキャンペーン | `CampaignStatus.Active` |
| 一時停止 | Paused | 一時的に停止中のキャンペーン | `CampaignStatus.Paused` |
| 完了 | Completed | 実施期間が終了したキャンペーン | `CampaignStatus.Completed` |

## トラッキングコンテキスト

| 日本語 | English | 定義 | コード上の型名 |
|--------|---------|------|---------------|
| トラッキングイベント | Tracking Event | ユーザーの行動を記録した1件のデータ | `TrackingEvent` |
| イベントID | Event ID | イベントを一意に識別する値 | `EventId` |
| イベント種別 | Event Type | click / impression / conversion 等の分類 | `EventType` |
| クリック | Click | 広告やリンクのクリック行動 | `EventType.Click` |
| インプレッション | Impression | 広告の表示回数 | `EventType.Impression` |
| コンバージョン | Conversion | 目標達成（購入、登録等）のアクション | `EventType.Conversion` |
| タイムスタンプ | Timestamp | イベント発生日時（UTC） | `Date` |

## レポーティングコンテキスト

| 日本語 | English | 定義 | コード上の型名 |
|--------|---------|------|---------------|
| レポート | Report | 集計結果をまとめた出力物 | `Report` |
| 集計期間 | Aggregation Period | レポートの対象期間 | `DateRange` |
| メトリクス | Metrics | 計測指標（CTR, CVR, CPA 等） | `Metrics` |
| クリック率 | CTR (Click Through Rate) | インプレッションに対するクリックの割合 | `number` |
| コンバージョン率 | CVR (Conversion Rate) | クリックに対するコンバージョンの割合 | `number` |

## 共通

| 日本語 | English | 定義 | コード上の型名 |
|--------|---------|------|---------------|
| 金額 | Money | 通貨と金額の組み合わせ | `Money` |
| 通貨 | Currency | 金額の通貨単位（JPY, USD 等） | `Currency` |
| 日付範囲 | Date Range | 開始日と終了日のペア | `DateRange` |
