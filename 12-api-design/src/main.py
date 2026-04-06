"""
FastAPI エントリポイント

RESTful API のメインアプリケーション。
Items と Users の CRUD エンドポイントを提供する。
"""

from fastapi import FastAPI

from src.routers import items, users
from src.middleware.error_handler import register_error_handlers

app = FastAPI(
    title="Portfolio API",
    description="Items と Users の CRUD エンドポイントを提供する RESTful API",
    version="1.0.0",
)

# エラーハンドラの登録
register_error_handlers(app)

# ルーターの登録
app.include_router(items.router, prefix="/api/v1", tags=["Items"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])


@app.get("/health", tags=["System"])
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok"}
