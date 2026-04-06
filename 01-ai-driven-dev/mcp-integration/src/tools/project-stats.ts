import { z } from "zod";

// ---------------------------------------------------------------------------
// Project Stats Tool
// ---------------------------------------------------------------------------
// プロジェクトの統計情報を返す MCP ツール。
// デモ用にモックデータを返す。本番では GitHub API や CI/CD API から取得する。
// ---------------------------------------------------------------------------

/** Input schema */
export const ProjectStatsInputSchema = z.object({
  period: z
    .enum(["week", "month", "quarter"])
    .default("month")
    .describe("The time period for statistics"),
  category: z
    .enum(["commits", "issues", "pull-requests", "deployments", "all"])
    .default("all")
    .describe("The category of statistics to retrieve"),
});

export type ProjectStatsInput = z.infer<typeof ProjectStatsInputSchema>;

/** Stats output type */
interface ProjectStats {
  period: string;
  commits: {
    total: number;
    byAuthor: Record<string, number>;
    averagePerDay: number;
  };
  issues: {
    opened: number;
    closed: number;
    averageResolutionDays: number;
  };
  pullRequests: {
    opened: number;
    merged: number;
    averageReviewHours: number;
  };
  deployments: {
    total: number;
    successful: number;
    rollbacks: number;
    averageBuildMinutes: number;
  };
}

// デモ用のモックデータ
const MOCK_STATS: Record<string, ProjectStats> = {
  week: {
    period: "2026-03-31 to 2026-04-06",
    commits: {
      total: 47,
      byAuthor: { "dev-a": 18, "dev-b": 15, "dev-c": 14 },
      averagePerDay: 6.7,
    },
    issues: { opened: 12, closed: 9, averageResolutionDays: 2.1 },
    pullRequests: { opened: 8, merged: 7, averageReviewHours: 4.2 },
    deployments: {
      total: 5,
      successful: 5,
      rollbacks: 0,
      averageBuildMinutes: 3.8,
    },
  },
  month: {
    period: "2026-03",
    commits: {
      total: 189,
      byAuthor: { "dev-a": 72, "dev-b": 61, "dev-c": 56 },
      averagePerDay: 6.3,
    },
    issues: { opened: 45, closed: 38, averageResolutionDays: 3.2 },
    pullRequests: { opened: 32, merged: 29, averageReviewHours: 5.8 },
    deployments: {
      total: 18,
      successful: 17,
      rollbacks: 1,
      averageBuildMinutes: 4.1,
    },
  },
  quarter: {
    period: "2026 Q1",
    commits: {
      total: 623,
      byAuthor: { "dev-a": 241, "dev-b": 198, "dev-c": 184 },
      averagePerDay: 6.9,
    },
    issues: { opened: 142, closed: 128, averageResolutionDays: 3.8 },
    pullRequests: { opened: 98, merged: 91, averageReviewHours: 6.2 },
    deployments: {
      total: 52,
      successful: 49,
      rollbacks: 3,
      averageBuildMinutes: 4.3,
    },
  },
};

/**
 * プロジェクト統計を取得する
 */
export function getProjectStats(input: ProjectStatsInput): Partial<ProjectStats> {
  const { period, category } = ProjectStatsInputSchema.parse(input);
  const stats = MOCK_STATS[period];

  if (category === "all") {
    return stats;
  }

  const categoryMap: Record<string, keyof ProjectStats> = {
    commits: "commits",
    issues: "issues",
    "pull-requests": "pullRequests",
    deployments: "deployments",
  };

  const key = categoryMap[category];
  return {
    period: stats.period,
    [key]: stats[key],
  };
}

/** Tool definition for MCP registration */
export const projectStatsToolDefinition = {
  name: "project_stats",
  description:
    "Get project statistics including commits, issues, pull requests, and deployments for a given time period.",
  inputSchema: ProjectStatsInputSchema,
};
