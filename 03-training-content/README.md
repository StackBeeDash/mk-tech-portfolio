# 03: Training Content

トレーニングコンテンツの設計・開発に関するポートフォリオ。MCT（Microsoft Certified Trainer）としての経験を基盤に、効果的な技術教育コンテンツを構築する手法を示す。

## Why この設計にしたか

### 教材設計の考え方（Pedagogical Approach）

MCT として数百名の受講者にトレーニングを提供してきた経験から、以下の原則を教材設計に適用している。

1. **ハンズオン中心の学習設計**
   - 座学だけでは定着しない。手を動かして「動いた！」という成功体験が学習の定着率を劇的に向上させる
   - Microsoft Official Courseware でも、ラボ（実習）が学習時間の 40-60% を占める構成が標準
   - 本ポートフォリオでは FastAPI を題材に、ゼロから API を構築するハンズオンラボを用意

2. **スキャフォールディング（足場かけ）**
   - 学習者が「次に何をすればいいか」迷わないよう、Step-by-step で手順を明示
   - 各ステップの冒頭に「このステップで学ぶこと」を記載し、目的意識を持たせる
   - 完成コードを別途提供し、詰まった場合のセーフティネットとする

3. **AI を活用した教材生成**
   - Claude API を使い、トークスクリプトやスライド構成案を自動生成するツールを開発
   - トレーナーが「教え方の設計」に集中できるよう、コンテンツのドラフト作成を AI に委譲
   - テンプレートベースのプロンプト設計で、品質の一貫性を確保

### ディレクトリ構成

```
03-training-content/
├── README.md                     # 本ファイル（トレーニング設計の考え方）
├── hands-on-lab/
│   ├── README.md                 # ラボの概要と前提条件
│   ├── lab-guide.md              # ハンズオンラボガイド（Step-by-step）
│   └── src/
│       ├── main.py               # FastAPI 完成コード
│       └── requirements.txt      # Python 依存パッケージ
└── course-generator/
    ├── README.md                 # AI コース生成ツールの概要
    ├── requirements.txt          # Python 依存パッケージ
    └── src/
        ├── generator.py          # Claude API を使った講座コンテンツ生成
        └── templates/
            ├── talk_script.txt   # トークスクリプト生成プロンプト
            └── slide_outline.txt # スライド構成案生成プロンプト
```

## 含まれるコンテンツ

| コンテンツ | 説明 |
|-----------|------|
| [ハンズオンラボ](hands-on-lab/) | FastAPI で REST API を構築するステップバイステップラボ |
| [AI コース生成ツール](course-generator/) | Claude API を活用した講座コンテンツ自動生成 |

## 技術スタック

- Python 3.11+
- FastAPI / Uvicorn
- Anthropic Claude API
- Pydantic
