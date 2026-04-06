-- =============================================================
-- Migration 003: pgvector 拡張追加
-- =============================================================
-- documents テーブルにベクトルカラムを追加し、
-- 類似検索用のインデックスを作成する。
--
-- Why pgvector を選択したか:
-- - PostgreSQL 内で完結し、外部ベクトル DB が不要
-- - SQL の JOIN と組み合わせてテナント分離付き検索が可能
-- - Supabase がネイティブサポート
-- =============================================================

-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- documents テーブルにベクトルカラムを追加
-- 1536次元: OpenAI text-embedding-ada-002 の出力次元数
ALTER TABLE documents
  ADD COLUMN embedding vector(1536);

-- IVFFlat インデックス: 大量データでの近似最近傍検索を高速化
-- lists パラメータはデータ量に応じて調整する（目安: sqrt(行数)）
CREATE INDEX idx_documents_embedding ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ------------------------------------------------------------
-- ベクトル類似検索用の関数
-- テナント分離を考慮した検索を提供する
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  title varchar,
  content text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE
    d.tenant_id = current_tenant_id()
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;
