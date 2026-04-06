"""Items CRUD エンドポイント"""

from fastapi import APIRouter, Query, Response, status

from src.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from src.services.item_service import item_service

router = APIRouter()


@router.get("/items", response_model=list[ItemResponse])
async def list_items(
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """アイテム一覧を取得する"""
    items, total = item_service.list_items(skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(data: ItemCreate):
    """アイテムを作成する"""
    return item_service.create_item(data)


@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    """アイテムを1件取得する"""
    return item_service.get_item(item_id)


@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, data: ItemUpdate):
    """アイテムを更新する"""
    return item_service.update_item(item_id, data)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str):
    """アイテムを削除する"""
    item_service.delete_item(item_id)
