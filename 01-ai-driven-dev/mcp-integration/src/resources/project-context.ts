// ---------------------------------------------------------------------------
// MCP Resources — プロジェクトコンテキスト
// ---------------------------------------------------------------------------
// MCP リソースは、LLM が参照できる静的/動的な情報源を提供する。
// ツール（関数呼び出し）とは異なり、リソースは「読み取り専用のデータ」を公開する。
// ---------------------------------------------------------------------------

/** プロジェクトのアーキテクチャ概要 */
export const architectureOverview = {
  uri: "project://architecture/overview",
  name: "Architecture Overview",
  description: "High-level architecture of the project",
  mimeType: "text/markdown" as const,
  content: `# Architecture Overview

## System Architecture

The application follows a **modular monolith** architecture deployed on GCP Cloud Run.

### Components
- **Web Frontend**: Next.js 14 (App Router) deployed on Vercel
- **API Server**: tRPC on Cloud Run
- **Database**: Cloud SQL (PostgreSQL 16)
- **Cache**: Redis on Memorystore
- **Storage**: Cloud Storage for file uploads
- **Queue**: Cloud Tasks for async processing

### Data Flow
1. Client → Vercel Edge → Next.js Server Components
2. Server Components → tRPC Client → Cloud Run API
3. Cloud Run API → Cloud SQL / Redis / Cloud Storage
4. Async jobs: Cloud Tasks → Cloud Run Workers

### Key Constraints
- All API calls must complete within 30 seconds
- File uploads are limited to 50MB
- Database connections are pooled (max 20 per instance)
- Auto-scaling: 0-10 instances based on CPU utilization
`,
};

/** プロジェクトの技術スタック */
export const techStack = {
  uri: "project://tech-stack",
  name: "Tech Stack",
  description: "Technologies and versions used in the project",
  mimeType: "application/json" as const,
  content: JSON.stringify(
    {
      frontend: {
        framework: "Next.js 14.2",
        language: "TypeScript 5.7",
        styling: "Tailwind CSS 3.4",
        components: "shadcn/ui",
        stateManagement: "Zustand 5",
        formHandling: "React Hook Form + Zod",
      },
      backend: {
        runtime: "Node.js 22 LTS",
        apiLayer: "tRPC 11",
        orm: "Drizzle ORM",
        validation: "Zod 3.24",
        authentication: "Lucia Auth v3",
      },
      infrastructure: {
        cloud: "Google Cloud Platform",
        compute: "Cloud Run",
        database: "Cloud SQL (PostgreSQL 16)",
        cache: "Memorystore (Redis 7)",
        storage: "Cloud Storage",
        cdn: "Vercel Edge Network",
        ci_cd: "GitHub Actions",
      },
      testing: {
        unit: "Vitest",
        e2e: "Playwright",
        api: "Supertest",
        coverage: "Istanbul via c8",
      },
    },
    null,
    2
  ),
};

/** コーディング規約 */
export const codingConventions = {
  uri: "project://conventions/coding",
  name: "Coding Conventions",
  description: "Coding standards and conventions for the project",
  mimeType: "text/markdown" as const,
  content: `# Coding Conventions

## File Structure
- Use kebab-case for file names: \`user-profile.ts\`
- Components use PascalCase: \`UserProfile.tsx\`
- Test files are co-located: \`user-profile.test.ts\`
- Max 300 lines per file

## TypeScript
- Prefer \`interface\` over \`type\` for object shapes
- Use \`unknown\` instead of \`any\`
- All functions must have explicit return types
- Use discriminated unions for state management

## Error Handling
- Use Result<T, E> pattern: never throw from business logic
- API errors return \`{ code, message, details }\`
- Use Zod for all external input validation

## Naming
- Boolean variables: \`is\`, \`has\`, \`should\` prefix
- Event handlers: \`handle\` prefix (\`handleSubmit\`)
- Async functions: descriptive verb (\`fetchUsers\`, \`createOrder\`)

## Git
- Conventional Commits required
- Branch: \`feat/\`, \`fix/\`, \`chore/\`
- Squash merge to main
`,
};

/** 全リソースのリスト */
export const allResources = [
  architectureOverview,
  techStack,
  codingConventions,
];
