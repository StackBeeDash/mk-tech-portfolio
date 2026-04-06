"""
API テスト

pytest + httpx の TestClient を使用して
Items / Users エンドポイントの CRUD 操作をテストする。
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.item_service import item_service
from src.services.user_service import user_service


@pytest.fixture(autouse=True)
def clear_stores():
    """各テストの前にストアをクリアする"""
    item_service._store.clear()
    user_service._store.clear()
    yield


client = TestClient(app)


# =============================================================
# Health Check
# =============================================================


class TestHealthCheck:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# =============================================================
# Items API
# =============================================================


class TestItemsAPI:
    def test_create_item(self):
        response = client.post(
            "/api/v1/items",
            json={"name": "テストアイテム", "description": "説明文", "price": 1500},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "テストアイテム"
        assert data["description"] == "説明文"
        assert data["price"] == 1500
        assert "id" in data
        assert "createdAt" in data
        assert "updatedAt" in data

    def test_create_item_validation_error(self):
        response = client.post(
            "/api/v1/items",
            json={"name": "", "price": -100},
        )
        assert response.status_code == 422

    def test_list_items_empty(self):
        response = client.get("/api/v1/items")
        assert response.status_code == 200
        assert response.json() == []
        assert response.headers.get("X-Total-Count") == "0"

    def test_list_items_with_data(self):
        # 3件作成
        for i in range(3):
            client.post(
                "/api/v1/items",
                json={"name": f"Item {i}", "price": 100 * (i + 1)},
            )

        response = client.get("/api/v1/items")
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert response.headers.get("X-Total-Count") == "3"

    def test_list_items_pagination(self):
        for i in range(5):
            client.post(
                "/api/v1/items",
                json={"name": f"Item {i}", "price": 100},
            )

        response = client.get("/api/v1/items?skip=2&limit=2")
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.headers.get("X-Total-Count") == "5"

    def test_get_item(self):
        create_resp = client.post(
            "/api/v1/items",
            json={"name": "Get Test", "price": 500},
        )
        item_id = create_resp.json()["id"]

        response = client.get(f"/api/v1/items/{item_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "Get Test"

    def test_get_item_not_found(self):
        response = client.get("/api/v1/items/nonexistent-id")
        assert response.status_code == 404
        data = response.json()
        assert data["status"] == 404
        assert data["title"] == "Not Found"

    def test_update_item(self):
        create_resp = client.post(
            "/api/v1/items",
            json={"name": "Original", "price": 100},
        )
        item_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/items/{item_id}",
            json={"name": "Updated", "price": 200},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"
        assert response.json()["price"] == 200

    def test_update_item_partial(self):
        create_resp = client.post(
            "/api/v1/items",
            json={"name": "Partial", "description": "desc", "price": 100},
        )
        item_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/items/{item_id}",
            json={"price": 999},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Partial"
        assert response.json()["price"] == 999

    def test_delete_item(self):
        create_resp = client.post(
            "/api/v1/items",
            json={"name": "To Delete", "price": 100},
        )
        item_id = create_resp.json()["id"]

        response = client.delete(f"/api/v1/items/{item_id}")
        assert response.status_code == 204

        # 削除後は 404
        get_resp = client.get(f"/api/v1/items/{item_id}")
        assert get_resp.status_code == 404

    def test_delete_item_not_found(self):
        response = client.delete("/api/v1/items/nonexistent-id")
        assert response.status_code == 404


# =============================================================
# Users API
# =============================================================


class TestUsersAPI:
    def test_create_user(self):
        response = client.post(
            "/api/v1/users",
            json={"email": "test@example.com", "name": "テストユーザー"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "テストユーザー"
        assert data["isActive"] is True

    def test_create_user_duplicate_email(self):
        client.post(
            "/api/v1/users",
            json={"email": "dup@example.com", "name": "User 1"},
        )
        response = client.post(
            "/api/v1/users",
            json={"email": "dup@example.com", "name": "User 2"},
        )
        assert response.status_code == 409
        assert response.json()["title"] == "Conflict"

    def test_list_users(self):
        client.post(
            "/api/v1/users",
            json={"email": "a@example.com", "name": "User A"},
        )
        client.post(
            "/api/v1/users",
            json={"email": "b@example.com", "name": "User B"},
        )

        response = client.get("/api/v1/users")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_user(self):
        create_resp = client.post(
            "/api/v1/users",
            json={"email": "get@example.com", "name": "Get User"},
        )
        user_id = create_resp.json()["id"]

        response = client.get(f"/api/v1/users/{user_id}")
        assert response.status_code == 200
        assert response.json()["email"] == "get@example.com"

    def test_get_user_not_found(self):
        response = client.get("/api/v1/users/nonexistent-id")
        assert response.status_code == 404

    def test_update_user(self):
        create_resp = client.post(
            "/api/v1/users",
            json={"email": "update@example.com", "name": "Original"},
        )
        user_id = create_resp.json()["id"]

        response = client.put(
            f"/api/v1/users/{user_id}",
            json={"name": "Updated Name", "is_active": False},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        assert response.json()["isActive"] is False

    def test_delete_user(self):
        create_resp = client.post(
            "/api/v1/users",
            json={"email": "delete@example.com", "name": "Delete Me"},
        )
        user_id = create_resp.json()["id"]

        response = client.delete(f"/api/v1/users/{user_id}")
        assert response.status_code == 204

        get_resp = client.get(f"/api/v1/users/{user_id}")
        assert get_resp.status_code == 404
