"""Users CRUD エンドポイント"""

from fastapi import APIRouter, Query, Response, status

from src.schemas.user import UserCreate, UserResponse, UserUpdate
from src.services.user_service import user_service

router = APIRouter()


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """ユーザー一覧を取得する"""
    users, total = user_service.list_users(skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(total)
    return users


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate):
    """ユーザーを作成する"""
    return user_service.create_user(data)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """ユーザーを1件取得する"""
    return user_service.get_user(user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: UserUpdate):
    """ユーザーを更新する"""
    return user_service.update_user(user_id, data)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    """ユーザーを削除する"""
    user_service.delete_user(user_id)
