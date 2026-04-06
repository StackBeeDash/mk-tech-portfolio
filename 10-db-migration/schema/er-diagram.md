# ER図

マルチテナント SaaS のデータモデルを定義します。

## Why このテーブル構成にしたか

- `tenants` を独立テーブルとし、全テーブルに `tenant_id` を持たせることで RLS の基盤とする
- `users` はテナントに所属し、複数プロジェクトに参加できる（多対多）
- `tasks` はプロジェクト配下に階層構造を持ち、親タスク・子タスクを表現できる
- `documents` にベクトルカラムを持たせ、ナレッジベースの類似検索を可能にする

## ER図

```mermaid
erDiagram
    tenants {
        uuid id PK
        varchar name
        varchar slug UK
        varchar plan
        timestamp created_at
        timestamp updated_at
    }

    users {
        uuid id PK
        uuid tenant_id FK
        varchar email UK
        varchar name
        varchar role
        timestamp created_at
        timestamp updated_at
    }

    projects {
        uuid id PK
        uuid tenant_id FK
        varchar name
        text description
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    project_members {
        uuid project_id FK
        uuid user_id FK
        varchar role
        timestamp joined_at
    }

    tasks {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        uuid assignee_id FK
        uuid parent_task_id FK
        varchar title
        text description
        varchar status
        varchar priority
        date due_date
        timestamp created_at
        timestamp updated_at
    }

    documents {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        uuid author_id FK
        varchar title
        text content
        vector embedding
        timestamp created_at
        timestamp updated_at
    }

    tenants ||--o{ users : "has"
    tenants ||--o{ projects : "has"
    tenants ||--o{ tasks : "has"
    tenants ||--o{ documents : "has"
    projects ||--o{ project_members : "has"
    users ||--o{ project_members : "belongs to"
    projects ||--o{ tasks : "has"
    users ||--o{ tasks : "assigned to"
    tasks ||--o{ tasks : "parent"
    projects ||--o{ documents : "has"
    users ||--o{ documents : "authored by"
```

## テーブル設計の補足

### tenants
- `slug`: URL フレンドリーなテナント識別子（例: `acme-corp`）
- `plan`: 料金プラン（`free`, `pro`, `enterprise`）

### users
- `role`: テナント内の役割（`owner`, `admin`, `member`）
- 1ユーザーは1テナントに所属（マルチテナント対応は招待制）

### tasks
- `parent_task_id`: 自己参照で階層タスクを実現
- `priority`: `low`, `medium`, `high`, `urgent`
- `status`: `todo`, `in_progress`, `done`, `cancelled`

### documents
- `embedding`: pgvector の `vector(1536)` 型。OpenAI text-embedding-ada-002 の次元数に合わせている
- ナレッジベース内の類似ドキュメント検索に使用
