"""
Items ビジネスロジック（インメモリストレージ）

デモ用にインメモリで CRUD 操作を提供する。
本番環境では DB を使う実装に差し替える。
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from src.schemas.item import ItemCreate, ItemUpdate


class ItemNotFoundError(Exception):
    """アイテムが見つからない場合のエラー"""

    def __init__(self, item_id: str):
        self.item_id = item_id
        super().__init__(f"Item not found: {item_id}")


class ItemService:
    def __init__(self):
        self._store: dict[str, dict] = {}

    def list_items(self, skip: int = 0, limit: int = 20) -> tuple[list[dict], int]:
        """アイテム一覧を取得する。(items, total_count) を返す。"""
        all_items = list(self._store.values())
        total = len(all_items)
        return all_items[skip : skip + limit], total

    def get_item(self, item_id: str) -> dict:
        """アイテムを1件取得する。"""
        item = self._store.get(item_id)
        if not item:
            raise ItemNotFoundError(item_id)
        return item

    def create_item(self, data: ItemCreate) -> dict:
        """アイテムを作成する。"""
        now = datetime.now(timezone.utc)
        item = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "description": data.description,
            "price": data.price,
            "createdAt": now,
            "updatedAt": now,
        }
        self._store[item["id"]] = item
        return item

    def update_item(self, item_id: str, data: ItemUpdate) -> dict:
        """アイテムを更新する。"""
        item = self._store.get(item_id)
        if not item:
            raise ItemNotFoundError(item_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            item[key] = value
        item["updatedAt"] = datetime.now(timezone.utc)
        return item

    def delete_item(self, item_id: str) -> None:
        """アイテムを削除する。"""
        if item_id not in self._store:
            raise ItemNotFoundError(item_id)
        del self._store[item_id]


# シングルトンインスタンス
item_service = ItemService()
