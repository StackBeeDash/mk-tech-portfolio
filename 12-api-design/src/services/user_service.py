"""
Users ビジネスロジック（インメモリストレージ）

デモ用にインメモリで CRUD 操作を提供する。
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from src.schemas.user import UserCreate, UserUpdate


class UserNotFoundError(Exception):
    """ユーザーが見つからない場合のエラー"""

    def __init__(self, user_id: str):
        self.user_id = user_id
        super().__init__(f"User not found: {user_id}")


class UserEmailConflictError(Exception):
    """メールアドレスが既に使用されている場合のエラー"""

    def __init__(self, email: str):
        self.email = email
        super().__init__(f"Email already in use: {email}")


class UserService:
    def __init__(self):
        self._store: dict[str, dict] = {}

    def list_users(self, skip: int = 0, limit: int = 20) -> tuple[list[dict], int]:
        """ユーザー一覧を取得する。(users, total_count) を返す。"""
        all_users = list(self._store.values())
        total = len(all_users)
        return all_users[skip : skip + limit], total

    def get_user(self, user_id: str) -> dict:
        """ユーザーを1件取得する。"""
        user = self._store.get(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return user

    def create_user(self, data: UserCreate) -> dict:
        """ユーザーを作成する。"""
        # メールアドレスの重複チェック
        for existing in self._store.values():
            if existing["email"] == data.email:
                raise UserEmailConflictError(data.email)

        now = datetime.now(timezone.utc)
        user = {
            "id": str(uuid.uuid4()),
            "email": data.email,
            "name": data.name,
            "isActive": True,
            "createdAt": now,
            "updatedAt": now,
        }
        self._store[user["id"]] = user
        return user

    def update_user(self, user_id: str, data: UserUpdate) -> dict:
        """ユーザーを更新する。"""
        user = self._store.get(user_id)
        if not user:
            raise UserNotFoundError(user_id)

        update_data = data.model_dump(exclude_unset=True)

        # メールアドレス変更時の重複チェック
        if "email" in update_data:
            for existing in self._store.values():
                if existing["id"] != user_id and existing["email"] == update_data["email"]:
                    raise UserEmailConflictError(update_data["email"])

        # is_active -> isActive のマッピング
        if "is_active" in update_data:
            update_data["isActive"] = update_data.pop("is_active")

        for key, value in update_data.items():
            user[key] = value
        user["updatedAt"] = datetime.now(timezone.utc)
        return user

    def delete_user(self, user_id: str) -> None:
        """ユーザーを削除する。"""
        if user_id not in self._store:
            raise UserNotFoundError(user_id)
        del self._store[user_id]


# シングルトンインスタンス
user_service = UserService()
