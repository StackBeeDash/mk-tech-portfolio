import { z } from "zod";

// ---------------------------------------------------------------------------
// Semantic Search Tool
// ---------------------------------------------------------------------------
// プロジェクトのドキュメントやコードベースに対してセマンティック検索を行う。
// デモ用にインメモリのベクトルストアを使用。
// 本番環境では Pinecone, Qdrant, pgvector 等に置き換える。
// ---------------------------------------------------------------------------

/** ドキュメントの型定義 */
interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[];
  embedding?: number[];
}

/** 検索結果の型定義 */
interface SearchResult {
  document: Document;
  score: number;
}

// デモ用のドキュメントデータ
const DEMO_DOCUMENTS: Document[] = [
  {
    id: "doc-001",
    title: "Authentication Architecture",
    content:
      "The system uses JWT tokens with RSA-256 signing. Refresh tokens are stored in HttpOnly cookies. Access tokens expire after 15 minutes. The auth flow supports OAuth2 providers (Google, GitHub) via passport.js.",
    tags: ["auth", "security", "jwt"],
  },
  {
    id: "doc-002",
    title: "Database Migration Strategy",
    content:
      "We use Drizzle ORM for schema management. Migrations are generated via drizzle-kit and applied automatically in CI/CD. Rollback is supported via down migrations. Schema changes require a PR review from the DB team.",
    tags: ["database", "migration", "drizzle"],
  },
  {
    id: "doc-003",
    title: "API Rate Limiting",
    content:
      "Rate limiting is implemented at the API gateway level using a token bucket algorithm. Free tier: 100 requests/minute. Pro tier: 1000 requests/minute. Rate limit headers (X-RateLimit-*) are included in all responses.",
    tags: ["api", "rate-limit", "security"],
  },
  {
    id: "doc-004",
    title: "Deployment Pipeline",
    content:
      "The CI/CD pipeline uses GitHub Actions. On push to main: lint, test, build, deploy to staging. On release tag: deploy to production. Blue-green deployment is used for zero-downtime releases.",
    tags: ["ci-cd", "deployment", "github-actions"],
  },
  {
    id: "doc-005",
    title: "Error Handling Patterns",
    content:
      "We use the Result<T, E> pattern instead of throwing exceptions. All API errors return structured JSON with error code, message, and details. Client-side errors are captured by Sentry and categorized by severity.",
    tags: ["error-handling", "patterns", "api"],
  },
];

/** Input schema for the semantic search tool */
export const SemanticSearchInputSchema = z.object({
  query: z.string().min(1).describe("The search query in natural language"),
  maxResults: z
    .number()
    .int()
    .positive()
    .default(3)
    .describe("Maximum number of results to return"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Optional tags to filter results"),
});

export type SemanticSearchInput = z.infer<typeof SemanticSearchInputSchema>;

/**
 * 簡易的なテキスト類似度計算（TF-IDF 風）
 * 本番では OpenAI Embeddings や Cohere 等のベクトル埋め込みを使用する
 */
function calculateSimilarity(query: string, text: string): number {
  const queryTokens = tokenize(query);
  const textTokens = tokenize(text);
  const textTokenSet = new Set(textTokens);

  if (queryTokens.length === 0) return 0;

  let matchCount = 0;
  for (const token of queryTokens) {
    if (textTokenSet.has(token)) {
      matchCount++;
    }
  }

  // Jaccard-like similarity with query coverage boost
  const queryCoverage = matchCount / queryTokens.length;
  const jaccardDenominator = new Set([...queryTokens, ...textTokens]).size;
  const jaccard = matchCount / jaccardDenominator;

  return queryCoverage * 0.7 + jaccard * 0.3;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * セマンティック検索を実行する
 */
export function semanticSearch(input: SemanticSearchInput): SearchResult[] {
  const { query, maxResults, tags } = SemanticSearchInputSchema.parse(input);

  let candidates = DEMO_DOCUMENTS;

  // タグフィルタ
  if (tags && tags.length > 0) {
    candidates = candidates.filter((doc) =>
      tags.some((tag) => doc.tags.includes(tag))
    );
  }

  // スコアリング
  const scored: SearchResult[] = candidates.map((doc) => {
    const titleScore = calculateSimilarity(query, doc.title) * 1.5;
    const contentScore = calculateSimilarity(query, doc.content);
    const tagScore = doc.tags.some((t) =>
      query.toLowerCase().includes(t)
    )
      ? 0.2
      : 0;

    return {
      document: doc,
      score: Math.min(1.0, titleScore + contentScore + tagScore),
    };
  });

  // スコア順にソートして上位 N 件を返す
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .filter((r) => r.score > 0.05);
}

/** Tool definition for MCP registration */
export const semanticSearchToolDefinition = {
  name: "semantic_search",
  description:
    "Search project documentation and codebase using natural language queries. Returns relevant documents ranked by relevance score.",
  inputSchema: SemanticSearchInputSchema,
};
