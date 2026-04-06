# ハンズオンラボガイド: FastAPI で TODO API を作る

## ラボの目標

このラボを完了すると、以下ができるようになります:

- FastAPI を使って REST API エンドポイントを定義できる
- Pydantic モデルでリクエスト/レスポンスのスキーマを定義できる
- CRUD 操作（作成・取得・更新・削除）を実装できる
- 適切な HTTP ステータスコードを返せる
- Swagger UI で API をテストできる

---

## Step 1: プロジェクトのセットアップ

**このステップで学ぶこと**: Python の仮想環境作成と FastAPI のインストール

### 1.1 作業ディレクトリを作成

```bash
mkdir todo-api && cd todo-api
```

### 1.2 仮想環境を作成・有効化

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

### 1.3 必要なパッケージをインストール

```bash
pip install fastapi uvicorn
```

### 1.4 動作確認

`main.py` を作成し、以下を記述:

```python
from fastapi import FastAPI

app = FastAPI(title="TODO API", version="1.0.0")


@app.get("/")
def root():
    return {"message": "Hello, FastAPI!"}
```

サーバーを起動:

```bash
uvicorn main:app --reload
```

ブラウザで http://localhost:8000 にアクセスし、`{"message": "Hello, FastAPI!"}` が表示されれば成功。

> **チェックポイント**: http://localhost:8000/docs にアクセスして Swagger UI が表示されることも確認しましょう。

---

## Step 2: データモデルの定義

**このステップで学ぶこと**: Pydantic を使ったリクエスト/レスポンスのスキーマ定義

### 2.1 TODO アイテムのモデルを定義

`main.py` に以下を追加:

```python
from pydantic import BaseModel, Field
from datetime import datetime


class TodoCreate(BaseModel):
    """TODO 作成リクエスト"""
    title: str = Field(..., min_length=1, max_length=100, examples=["牛乳を買う"])
    description: str | None = Field(default=None, max_length=500, examples=["スーパーで低脂肪乳を購入"])


class TodoResponse(BaseModel):
    """TODO レスポンス"""
    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime


class TodoUpdate(BaseModel):
    """TODO 更新リクエスト"""
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    completed: bool | None = None
```

> **ポイント**: `Field(...)` の `...` は「必須」を意味します。`examples` を指定すると Swagger UI にサンプル値が表示されます。

---

## Step 3: インメモリストレージの実装

**このステップで学ぶこと**: シンプルなデータストアの設計

### 3.1 ストレージを定義

`main.py` に以下を追加:

```python
# インメモリストレージ（DB の代わり）
todos: dict[int, dict] = {}
next_id: int = 1
```

> **補足**: 実運用では DB（PostgreSQL, SQLite 等）を使いますが、このラボでは API 設計に集中するためインメモリで実装します。

---

## Step 4: CRUD エンドポイントの実装

**このステップで学ぶこと**: RESTful なエンドポイント設計と HTTP ステータスコード

### 4.1 TODO を作成（POST）

```python
from fastapi import FastAPI, HTTPException, status


@app.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoCreate):
    global next_id
    now = datetime.now()
    todo_item = {
        "id": next_id,
        "title": todo.title,
        "description": todo.description,
        "completed": False,
        "created_at": now,
    }
    todos[next_id] = todo_item
    next_id += 1
    return todo_item
```

### 4.2 TODO 一覧を取得（GET）

```python
@app.get("/todos", response_model=list[TodoResponse])
def list_todos(completed: bool | None = None):
    items = list(todos.values())
    if completed is not None:
        items = [t for t in items if t["completed"] == completed]
    return items
```

### 4.3 TODO を 1 件取得（GET）

```python
@app.get("/todos/{todo_id}", response_model=TodoResponse)
def get_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    return todos[todo_id]
```

### 4.4 TODO を更新（PATCH）

```python
@app.patch("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate):
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    existing = todos[todo_id]
    update_data = todo.model_dump(exclude_unset=True)
    existing.update(update_data)
    return existing
```

### 4.5 TODO を削除（DELETE）

```python
@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    del todos[todo_id]
```

---

## Step 5: Swagger UI でテスト

**このステップで学ぶこと**: API ドキュメントの活用とテスト方法

### 5.1 Swagger UI にアクセス

ブラウザで http://localhost:8000/docs を開く。

### 5.2 テストシナリオ

以下の順序で操作してみましょう:

1. **POST /todos** で TODO を 2-3 件作成
2. **GET /todos** で一覧を確認
3. **GET /todos/{todo_id}** で 1 件取得
4. **PATCH /todos/{todo_id}** で `completed: true` に更新
5. **GET /todos?completed=true** でフィルタリング確認
6. **DELETE /todos/{todo_id}** で削除
7. **GET /todos/{todo_id}** で削除済みアイテムにアクセスし、404 エラーを確認

> **チェックポイント**: 各操作のレスポンスコード（201, 200, 204, 404）が期待通りか確認しましょう。

---

## Step 6: エラーハンドリングの強化

**このステップで学ぶこと**: バリデーションエラーとカスタムエラーレスポンス

### 6.1 バリデーションエラーを確認

POST /todos で以下のリクエストを送信してみましょう:

```json
{
  "title": ""
}
```

FastAPI が自動的に 422 Unprocessable Entity を返すことを確認。

### 6.2 ヘルスチェックエンドポイントを追加

```python
@app.get("/health")
def health_check():
    return {"status": "healthy", "todo_count": len(todos)}
```

---

## 完了！

おめでとうございます。FastAPI を使った REST API の基本を習得しました。

### 発展課題（任意）

- SQLite または PostgreSQL に接続してデータを永続化する
- 認証（API キーまたは JWT）を追加する
- ページネーション（`skip`, `limit` パラメータ）を実装する
- テスト（pytest + httpx）を書く

### 完成コード

`src/` ディレクトリに完成版のコードがあります。詰まった場合は参照してください。
