# 12: API Design - RESTful API 設計 & 実装

RESTful API の設計原則と、FastAPI による実装サンプルです。

## Why この設計にしたか

### 1. REST を選択した理由

| 方式 | 適用場面 | 今回の判断 |
|------|----------|------------|
| REST | CRUD 中心、リソース指向、キャッシュが重要 | **採用** |
| GraphQL | フロントエンドが多様、データ取得の柔軟性が必要 | 見送り |
| gRPC | マイクロサービス間通信、低レイテンシ | 見送り |

今回の Items / Users API は典型的な CRUD 操作であり、REST が最もシンプルかつ広く理解される選択です。

### 2. API 設計原則

#### リソース設計
- URL はリソース（名詞）を表現し、操作（動詞）は HTTP メソッドで表現する
- 例: `POST /api/v1/items`（アイテム作成）、`GET /api/v1/items/{id}`（アイテム取得）

#### 命名規則
- URL パスはケバブケース（`kebab-case`）
- クエリパラメータはスネークケース（`snake_case`）
- レスポンスボディは キャメルケース（`camelCase`）

#### バージョニング
- URL パスにバージョンを含める（`/api/v1/`）
- 理由: クライアントが明示的にバージョンを指定でき、移行が段階的に行える

#### エラーハンドリング
- RFC 7807 (Problem Details) に準拠したエラーレスポンス
- 統一フォーマット: `{ "detail": "...", "status": 404, "title": "Not Found" }`

#### ページネーション
- `skip` / `limit` パラメータによるオフセットベースページネーション
- レスポンスヘッダに `X-Total-Count` を含める

### 3. FastAPI を選択した理由

- Python の型ヒント + Pydantic でスキーマとバリデーションが自動化される
- OpenAPI 仕様が自動生成される（Swagger UI / ReDoc 付き）
- 非同期対応で高パフォーマンス
- 学習コストが低く、プロトタイピングが速い

## ディレクトリ構成

```
12-api-design/
├── README.md                      # この文書
├── openapi/
│   └── spec.yaml                  # OpenAPI 3.0 仕様
├── src/
│   ├── main.py                    # FastAPI エントリポイント
│   ├── routers/
│   │   ├── items.py               # Items CRUD エンドポイント
│   │   └── users.py               # Users CRUD エンドポイント
│   ├── schemas/
│   │   ├── item.py                # Item Pydantic モデル
│   │   └── user.py                # User Pydantic モデル
│   ├── services/
│   │   ├── item_service.py        # Items ビジネスロジック
│   │   └── user_service.py        # Users ビジネスロジック
│   └── middleware/
│       └── error_handler.py       # 統一エラーハンドリング
├── tests/
│   └── test_api.py                # pytest テスト
└── requirements.txt               # Python 依存パッケージ
```

## 実行方法

```bash
cd 12-api-design
pip install -r requirements.txt
uvicorn src.main:app --reload

# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

## テスト実行

```bash
cd 12-api-design
pytest tests/ -v
```
