# AI コース生成ツール

Claude API を活用して、技術トレーニングのコンテンツ（トークスクリプト、スライド構成案）を自動生成する Python ツール。

## Why この設計にしたか

### テンプレートベースのプロンプト設計を採用した理由

- **品質の一貫性**: 自由記述のプロンプトでは生成結果がばらつく。テンプレートに「対象者レベル」「所要時間」「学習目標」等の構造を定義することで、出力品質を安定させる
- **トレーナーの負担軽減**: MCT として多くの講座を設計してきた経験上、「教え方の設計」が最も価値のある作業。コンテンツのドラフト作成は AI に任せ、トレーナーはレビューと改善に集中できる
- **再利用性**: テンプレートを差し替えるだけで、異なるジャンル（クラウド、AI、プログラミング等）の教材を生成可能

### アーキテクチャ

```
course-generator/
├── README.md               # 本ファイル
├── requirements.txt        # Python 依存パッケージ
└── src/
    ├── generator.py        # メインスクリプト（Claude API 呼び出し）
    └── templates/
        ├── talk_script.txt    # トークスクリプト生成プロンプト
        └── slide_outline.txt  # スライド構成案生成プロンプト
```

## セットアップ

### 前提条件

- Python 3.11+
- Anthropic API キー

### インストール

```bash
cd course-generator
pip install -r requirements.txt
```

### 環境変数

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

> **注意**: API キーは環境変数で管理し、ソースコードにハードコードしないこと。

## 使い方

### トークスクリプト生成

```bash
python src/generator.py talk-script \
  --topic "FastAPI 入門" \
  --audience "Python 初学者" \
  --duration 60
```

### スライド構成案生成

```bash
python src/generator.py slide-outline \
  --topic "Docker コンテナ入門" \
  --audience "バックエンドエンジニア" \
  --duration 90
```

### オプション

| パラメータ | 説明 | デフォルト |
|-----------|------|-----------|
| `--topic` | 講座のテーマ | (必須) |
| `--audience` | 対象者 | (必須) |
| `--duration` | 所要時間（分） | 60 |
| `--output` | 出力ファイルパス | stdout |
| `--model` | Claude モデル名 | claude-sonnet-4-20250514 |

## テンプレートのカスタマイズ

`src/templates/` 配下のテンプレートファイルを編集することで、生成内容をカスタマイズできる。テンプレート内の `{topic}`, `{audience}`, `{duration}` はランタイムで置換される。

## 出力例

```
## スライド構成案: FastAPI 入門（60分）

### スライド 1: タイトル（2分）
- FastAPI 入門 〜 Python で爆速 API 開発〜
- 対象: Python 初学者

### スライド 2: アジェンダ（1分）
- FastAPI とは
- 環境構築
- 最初の API を作る
- ...
```
