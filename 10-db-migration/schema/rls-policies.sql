-- =============================================================
-- RLS (Row Level Security) ポリシー定義
-- =============================================================
-- Why RLS を使うのか:
-- アプリケーションコードに依存せず、DB エンジンレベルで
-- テナント間のデータ分離を強制する。WHERE tenant_id = ... の
-- 書き忘れによるデータ漏洩を構造的に防止する。
-- =============================================================

-- 前提: アプリケーションが接続時に以下を実行する
-- SET app.current_tenant_id = '<tenant_uuid>';

-- ------------------------------------------------------------
-- Helper function: 現在のテナントIDを取得
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    current_setting('app.current_tenant_id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- tenants テーブル
-- ------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON tenants
  USING (id = current_tenant_id());

CREATE POLICY tenant_insert_policy ON tenants
  FOR INSERT WITH CHECK (id = current_tenant_id());

-- ------------------------------------------------------------
-- users テーブル
-- ------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation_policy ON users
  USING (tenant_id = current_tenant_id());

CREATE POLICY user_insert_policy ON users
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ------------------------------------------------------------
-- projects テーブル
-- ------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_isolation_policy ON projects
  USING (tenant_id = current_tenant_id());

CREATE POLICY project_insert_policy ON projects
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ------------------------------------------------------------
-- project_members テーブル
-- (project 経由でテナント分離)
-- ------------------------------------------------------------
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_member_isolation_policy ON project_members
  USING (
    project_id IN (
      SELECT id FROM projects WHERE tenant_id = current_tenant_id()
    )
  );

-- ------------------------------------------------------------
-- tasks テーブル
-- ------------------------------------------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_isolation_policy ON tasks
  USING (tenant_id = current_tenant_id());

CREATE POLICY task_insert_policy ON tasks
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ------------------------------------------------------------
-- documents テーブル
-- ------------------------------------------------------------
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_isolation_policy ON documents
  USING (tenant_id = current_tenant_id());

CREATE POLICY document_insert_policy ON documents
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
