/**
 * DB接続 & クエリ例（Drizzle ORM）
 *
 * マルチテナント SaaS における DB 操作のサンプルコード。
 * ベクトル類似検索のクエリ例を含む。
 *
 * Why Drizzle ORM を選択したか:
 * - TypeScript ファーストで型安全なクエリが書ける
 * - SQL に近い記法で学習コストが低い
 * - マイグレーションツールが組み込み
 * - pgvector との連携が可能
 *
 * 注意: このファイルはサンプルコードです。
 * 実行には PostgreSQL + pgvector の環境が必要です。
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, uuid, varchar, text, timestamp, date } from "drizzle-orm/pg-core";
import { eq, and, sql } from "drizzle-orm";
import pg from "pg";

// =============================================================
// スキーマ定義
// =============================================================

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  parentTaskId: uuid("parent_task_id"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("todo"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  authorId: uuid("author_id").references(() => users.id),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull().default(""),
  // embedding カラムは pgvector 型のため、raw SQL で操作
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================
// DB接続
// =============================================================

/**
 * DB接続を作成する
 * 環境変数 DATABASE_URL から接続文字列を取得
 */
export function createDb(connectionString?: string) {
  const pool = new pg.Pool({
    connectionString: connectionString ?? process.env.DATABASE_URL,
  });
  return drizzle(pool);
}

/**
 * テナントコンテキストを設定する
 * RLS ポリシーが参照する app.current_tenant_id を設定
 */
export async function setTenantContext(db: ReturnType<typeof drizzle>, tenantId: string) {
  await db.execute(sql`SET app.current_tenant_id = ${tenantId}`);
}

// =============================================================
// クエリ例
// =============================================================

/**
 * テナントのプロジェクト一覧を取得する
 */
export async function getProjects(db: ReturnType<typeof drizzle>, tenantId: string) {
  await setTenantContext(db, tenantId);
  return db.select().from(projects).where(eq(projects.tenantId, tenantId));
}

/**
 * プロジェクトのタスク一覧を取得する（担当者情報付き）
 */
export async function getProjectTasks(
  db: ReturnType<typeof drizzle>,
  tenantId: string,
  projectId: string
) {
  await setTenantContext(db, tenantId);
  return db
    .select({
      taskId: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      assigneeName: users.name,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(eq(tasks.projectId, projectId), eq(tasks.tenantId, tenantId)));
}

/**
 * ベクトル類似検索: ドキュメントの類似検索
 *
 * pgvector の cosine distance (<=>演算子) を使用。
 * RLS により自動的にテナント分離される。
 *
 * @param queryEmbedding - 検索クエリの埋め込みベクトル (1536次元)
 * @param limit - 取得件数 (default: 5)
 * @param threshold - 類似度の閾値 (default: 0.7)
 */
export async function searchSimilarDocuments(
  db: ReturnType<typeof drizzle>,
  tenantId: string,
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.7
) {
  await setTenantContext(db, tenantId);

  // pgvector の類似検索クエリ
  // 1 - cosine_distance = cosine_similarity
  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const results = await db.execute(sql`
    SELECT
      id,
      title,
      content,
      1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM documents
    WHERE
      tenant_id = ${tenantId}::uuid
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `);

  return results.rows as Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
}

/**
 * 使用例（実行はしない - ドキュメント目的）
 *
 * ```typescript
 * const db = createDb("postgresql://user:pass@localhost:5432/mydb");
 * const tenantId = "a0000000-0000-0000-0000-000000000001";
 *
 * // プロジェクト一覧
 * const projects = await getProjects(db, tenantId);
 *
 * // タスク一覧
 * const tasks = await getProjectTasks(db, tenantId, projects[0].id);
 *
 * // ベクトル類似検索（実際には OpenAI API で embedding を取得する）
 * const embedding = new Array(1536).fill(0);
 * embedding[0] = 0.1; embedding[1] = 0.2; // サンプル値
 * const similar = await searchSimilarDocuments(db, tenantId, embedding);
 * ```
 */
