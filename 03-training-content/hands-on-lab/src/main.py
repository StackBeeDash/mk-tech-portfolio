"""
TODO API - FastAPI ハンズオンラボ完成コード

FastAPI を使った REST API の基本を学ぶためのサンプルアプリケーション。
インメモリストレージを使用し、CRUD 操作を実装している。
"""

from datetime import datetime

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

# --- Application ---

app = FastAPI(
    title="TODO API",
    description="FastAPI ハンズオンラボ - TODO 管理 API",
    version="1.0.0",
)

# --- Models ---


class TodoCreate(BaseModel):
    """TODO 作成リクエスト"""

    title: str = Field(
        ..., min_length=1, max_length=100, examples=["牛乳を買う"]
    )
    description: str | None = Field(
        default=None, max_length=500, examples=["スーパーで低脂肪乳を購入"]
    )


class TodoUpdate(BaseModel):
    """TODO 更新リクエスト"""

    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    completed: bool | None = None


class TodoResponse(BaseModel):
    """TODO レスポンス"""

    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime


# --- In-Memory Storage ---

todos: dict[int, dict] = {}
next_id: int = 1

# --- Endpoints ---


@app.get("/")
def root():
    """ルートエンドポイント"""
    return {"message": "Hello, FastAPI!", "docs": "/docs"}


@app.get("/health")
def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "todo_count": len(todos)}


@app.post(
    "/todos",
    response_model=TodoResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_todo(todo: TodoCreate):
    """TODO を作成する"""
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


@app.get("/todos", response_model=list[TodoResponse])
def list_todos(completed: bool | None = None):
    """TODO 一覧を取得する。completed パラメータでフィルタリング可能。"""
    items = list(todos.values())
    if completed is not None:
        items = [t for t in items if t["completed"] == completed]
    return items


@app.get("/todos/{todo_id}", response_model=TodoResponse)
def get_todo(todo_id: int):
    """TODO を 1 件取得する"""
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    return todos[todo_id]


@app.patch("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate):
    """TODO を更新する（部分更新対応）"""
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    existing = todos[todo_id]
    update_data = todo.model_dump(exclude_unset=True)
    existing.update(update_data)
    return existing


@app.delete(
    "/todos/{todo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_todo(todo_id: int):
    """TODO を削除する"""
    if todo_id not in todos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TODO with id {todo_id} not found",
        )
    del todos[todo_id]
