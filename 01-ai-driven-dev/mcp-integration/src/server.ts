import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  semanticSearch,
  SemanticSearchInputSchema,
} from "./tools/semantic-search.js";
import {
  getProjectStats,
  ProjectStatsInputSchema,
} from "./tools/project-stats.js";
import { allResources } from "./resources/project-context.js";

// ---------------------------------------------------------------------------
// MCP Server — Project Assistant
// ---------------------------------------------------------------------------
// Claude Code や他の MCP クライアントにプロジェクト固有の機能を提供する。
//
// 提供するもの:
//   Tools:     semantic_search, project_stats
//   Resources: architecture overview, tech stack, coding conventions
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "project-assistant",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool Registration
// ---------------------------------------------------------------------------

server.tool(
  "semantic_search",
  "Search project documentation using natural language. Returns relevant documents ranked by relevance.",
  {
    query: z.string().describe("Natural language search query"),
    maxResults: z
      .number()
      .int()
      .positive()
      .default(3)
      .describe("Maximum number of results"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags to filter by"),
  },
  async (args) => {
    const input = SemanticSearchInputSchema.parse(args);
    const results = semanticSearch(input);

    const formatted = results
      .map(
        (r, i) =>
          `${i + 1}. **${r.document.title}** (score: ${r.score.toFixed(2)})\n` +
          `   Tags: ${r.document.tags.join(", ")}\n` +
          `   ${r.document.content.slice(0, 200)}...`
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text:
            results.length > 0
              ? `Found ${results.length} results:\n\n${formatted}`
              : "No matching documents found.",
        },
      ],
    };
  }
);

server.tool(
  "project_stats",
  "Get project statistics (commits, issues, PRs, deployments) for a time period.",
  {
    period: z
      .enum(["week", "month", "quarter"])
      .default("month")
      .describe("Time period"),
    category: z
      .enum(["commits", "issues", "pull-requests", "deployments", "all"])
      .default("all")
      .describe("Statistics category"),
  },
  async (args) => {
    const input = ProjectStatsInputSchema.parse(args);
    const stats = getProjectStats(input);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Resource Registration
// ---------------------------------------------------------------------------

for (const resource of allResources) {
  server.resource(resource.name, resource.uri, async () => ({
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: resource.content,
      },
    ],
  }));
}

// ---------------------------------------------------------------------------
// Server Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server 'project-assistant' started on stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
