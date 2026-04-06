-- =============================================================
-- Migration 002: RLS ポリシー適用
-- =============================================================
-- tenant_id ベースの行レベルセキュリティを全テーブルに適用する。
-- アプリケーションは接続時に SET app.current_tenant_id を実行する。
-- =============================================================

-- Helper function: 現在のテナントIDを取得
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    current_setting('app.current_tenant_id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- RLS を有効化
-- ------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- SELECT / UPDATE / DELETE ポリシー
-- ------------------------------------------------------------
CREATE POLICY tenant_isolation_policy ON tenants
  USING (id = current_tenant_id());

CREATE POLICY user_isolation_policy ON users
  USING (tenant_id = current_tenant_id());

CREATE POLICY project_isolation_policy ON projects
  USING (tenant_id = current_tenant_id());

CREATE POLICY project_member_isolation_policy ON project_members
  USING (
    project_id IN (
      SELECT id FROM projects WHERE tenant_id = current_tenant_id()
    )
  );

CREATE POLICY task_isolation_policy ON tasks
  USING (tenant_id = current_tenant_id());

CREATE POLICY document_isolation_policy ON documents
  USING (tenant_id = current_tenant_id());

-- ------------------------------------------------------------
-- INSERT ポリシー
-- ------------------------------------------------------------
CREATE POLICY tenant_insert_policy ON tenants
  FOR INSERT WITH CHECK (id = current_tenant_id());

CREATE POLICY user_insert_policy ON users
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY project_insert_policy ON projects
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY task_insert_policy ON tasks
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY document_insert_policy ON documents
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
