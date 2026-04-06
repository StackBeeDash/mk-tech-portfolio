-- =============================================================
-- Migration 001: 初期テーブル作成
-- =============================================================
-- マルチテナント SaaS の基本テーブル構造を定義する。
-- 全テーブルに tenant_id を持たせ、RLS の基盤とする。
-- =============================================================

-- UUID 生成用の拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- tenants: テナント（組織）
-- ------------------------------------------------------------
CREATE TABLE tenants (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       varchar(255) NOT NULL,
    slug       varchar(100) NOT NULL UNIQUE,
    plan       varchar(50) NOT NULL DEFAULT 'free'
                 CHECK (plan IN ('free', 'pro', 'enterprise')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants (slug);

-- ------------------------------------------------------------
-- users: ユーザー
-- ------------------------------------------------------------
CREATE TABLE users (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email      varchar(255) NOT NULL UNIQUE,
    name       varchar(255) NOT NULL,
    role       varchar(50) NOT NULL DEFAULT 'member'
                 CHECK (role IN ('owner', 'admin', 'member')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_email ON users (email);

-- ------------------------------------------------------------
-- projects: プロジェクト
-- ------------------------------------------------------------
CREATE TABLE projects (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        varchar(255) NOT NULL,
    description text,
    status      varchar(50) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived', 'deleted')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_tenant_id ON projects (tenant_id);

-- ------------------------------------------------------------
-- project_members: プロジェクトメンバー（多対多）
-- ------------------------------------------------------------
CREATE TABLE project_members (
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       varchar(50) NOT NULL DEFAULT 'member'
                 CHECK (role IN ('owner', 'editor', 'viewer', 'member')),
    joined_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user_id ON project_members (user_id);

-- ------------------------------------------------------------
-- tasks: タスク（階層対応）
-- ------------------------------------------------------------
CREATE TABLE tasks (
    id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id    uuid REFERENCES users(id) ON DELETE SET NULL,
    parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
    title          varchar(500) NOT NULL,
    description    text,
    status         varchar(50) NOT NULL DEFAULT 'todo'
                     CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    priority       varchar(50) NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date       date,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_tenant_id ON tasks (tenant_id);
CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks (assignee_id);
CREATE INDEX idx_tasks_status ON tasks (status);

-- ------------------------------------------------------------
-- documents: ドキュメント（ベクトルカラムは後のマイグレーションで追加）
-- ------------------------------------------------------------
CREATE TABLE documents (
    id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id  uuid REFERENCES users(id) ON DELETE SET NULL,
    title      varchar(500) NOT NULL,
    content    text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_tenant_id ON documents (tenant_id);
CREATE INDEX idx_documents_project_id ON documents (project_id);

-- ------------------------------------------------------------
-- updated_at 自動更新トリガー
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
