"""User Pydantic モデル"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """ユーザー作成リクエスト"""

    email: EmailStr = Field(..., examples=["tanaka@example.com"])
    name: str = Field(..., min_length=1, max_length=255, examples=["田中太郎"])


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト（部分更新対応）"""

    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """ユーザーレスポンス"""

    id: str
    email: str
    name: str
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}
