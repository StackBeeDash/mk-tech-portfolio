# Business Automation Samples

非エンジニア向けの業務自動化サンプル集。Claude API と Slack API を活用して、日常業務を効率化する。

## Why -- なぜこの設計にしたか

多くの組織で、非エンジニアの業務時間の大部分が「情報の収集・整理・共有」に費やされている。これらのタスクは LLM が最も得意とする領域であり、適切に自動化することで大幅な効率改善が見込める。

本サンプル集では以下の設計方針を採用した:

1. **Python を採用**: 非エンジニアでも読みやすく、データ処理のエコシステムが豊富
2. **キーワードベースの分類 + LLM**: まずシンプルなルールで分類し、LLM は高度な要約・生成に使用。コストとレイテンシを最適化
3. **デモモード搭載**: API キーがなくてもサンプルデータで動作を確認できる

## Samples

### 1. Slack Monitor (`slack-monitor/`)

Slack チャンネルを監視し、重要メッセージを自動検知・通知するシステム。

**解決する課題:**
- 大量のチャンネルメッセージから重要な情報を見逃す
- 障害報告やエスカレーションの対応が遅れる
- 手動での監視が担当者の負担になる

**仕組み:**
```
Slack Channel → Monitor → Classify (Priority) → Notify
                             │
                    ┌────────┼────────┐
                    ▼        ▼        ▼
                CRITICAL    HIGH    MEDIUM
                (即座)    (2h以内)  (翌営業日)
```

**実行:**
```bash
cd slack-monitor
pip install -r requirements.txt
python monitor.py
```

### 2. Meeting Minutes Generator (`meeting-minutes/`)

音声文字起こしから構造化された議事録を自動生成するシステム。

**解決する課題:**
- 議事録の作成に時間がかかる（30分の会議に30分の整理作業）
- 決定事項やアクションアイテムの抜け漏れ
- 議事録のフォーマットが統一されない

**仕組み:**
```
Transcript → Parse → Extract → Format
                        │
               ┌────────┼────────┐
               ▼        ▼        ▼
           Decisions  Actions  Summary
```

**出力例:**
```markdown
# 週次定例ミーティング

- **日時**: 2026-04-06
- **参加者**: 佐藤, 田中, 鈴木
- **所要時間**: 3 分

## 決定事項
- 来週月曜日にステージング環境へデプロイ
- 外部セキュリティ監査を実施する方針

## アクションアイテム
| 内容 | 担当者 | 優先度 |
|------|--------|--------|
| ステージング環境のセットアップ | 鈴木 | medium |
| QAチームへのテスト依頼作成 | 佐藤 | medium |
```

**実行:**
```bash
cd meeting-minutes
pip install -r requirements.txt
python generator.py
```

## Production への拡張

デモ実装を本番環境に拡張する際のガイド:

### Slack Monitor
1. Slack App を作成し、Bot Token を取得
2. `slack-sdk` を使って WebSocket でリアルタイム監視
3. Claude API で高度なメッセージ分類・要約を追加
4. PagerDuty 連携で CRITICAL アラートをオンコール担当者に通知

### Meeting Minutes
1. Google Meet / Zoom の文字起こし機能と連携
2. Claude API でインテリジェントな要約・抽出を実装
3. Google Docs / Notion に自動投稿
4. Slack チャンネルへの議事録サマリ自動共有

## File Structure

```
business-automation/
├── slack-monitor/
│   ├── monitor.py          # Slack 監視スクリプト
│   └── requirements.txt    # Python 依存関係
├── meeting-minutes/
│   ├── generator.py        # 議事録生成スクリプト
│   └── requirements.txt    # Python 依存関係
└── README.md
```
