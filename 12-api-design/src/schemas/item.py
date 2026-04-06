"""Item Pydantic モデル"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    """アイテム作成リクエスト"""

    name: str = Field(..., min_length=1, max_length=255, examples=["ワイヤレスキーボード"])
    description: Optional[str] = Field(None, examples=["Bluetooth 5.0 対応、日本語配列"])
    price: float = Field(..., ge=0, examples=[8980])


class ItemUpdate(BaseModel):
    """アイテム更新リクエスト（部分更新対応）"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)


class ItemResponse(BaseModel):
    """アイテムレスポンス"""

    id: str
    name: str
    description: Optional[str] = None
    price: float
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}
