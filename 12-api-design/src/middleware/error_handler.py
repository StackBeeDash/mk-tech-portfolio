"""
統一エラーハンドリング

RFC 7807 (Problem Details) に準拠したエラーレスポンスを返す。
全エンドポイントで一貫したエラーフォーマットを提供する。
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.services.item_service import ItemNotFoundError
from src.services.user_service import UserNotFoundError, UserEmailConflictError


def register_error_handlers(app: FastAPI) -> None:
    """アプリケーションにエラーハンドラを登録する"""

    @app.exception_handler(ItemNotFoundError)
    async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
                "status": 404,
                "title": "Not Found",
            },
        )

    @app.exception_handler(UserNotFoundError)
    async def user_not_found_handler(request: Request, exc: UserNotFoundError):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
                "status": 404,
                "title": "Not Found",
            },
        )

    @app.exception_handler(UserEmailConflictError)
    async def user_email_conflict_handler(
        request: Request, exc: UserEmailConflictError
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
                "status": 409,
                "title": "Conflict",
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "status": 500,
                "title": "Internal Server Error",
            },
        )
