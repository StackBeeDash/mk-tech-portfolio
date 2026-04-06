import { z } from "zod";

// ---------------------------------------------------------------------------
// Agent Role Definition
// ---------------------------------------------------------------------------

export const AgentRole = z.enum([
  "analyst",
  "researcher",
  "critic",
  "synthesizer",
  "reporter",
]);
export type AgentRole = z.infer<typeof AgentRole>;

// ---------------------------------------------------------------------------
// Agent Configuration
// ---------------------------------------------------------------------------

export const AgentConfigSchema = z.object({
  role: AgentRole,
  systemPrompt: z.string().min(1),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().int().positive().default(2048),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ---------------------------------------------------------------------------
// Agent Response
// ---------------------------------------------------------------------------

export const AgentResponseSchema = z.object({
  role: AgentRole,
  content: z.string(),
  confidence: z.number().min(0).max(1),
  keyFindings: z.array(z.string()),
  timestamp: z.string().datetime(),
  durationMs: z.number().nonnegative(),
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// ---------------------------------------------------------------------------
// Orchestration Request / Result
// ---------------------------------------------------------------------------

export const OrchestrationRequestSchema = z.object({
  topic: z.string().min(1, "Topic must not be empty"),
  context: z.string().optional(),
  maxRounds: z.number().int().positive().default(1),
});
export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;

export const OrchestrationResultSchema = z.object({
  topic: z.string(),
  agentResponses: z.array(AgentResponseSchema),
  synthesis: z.string(),
  finalReport: z.string(),
  totalDurationMs: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});
export type OrchestrationResult = z.infer<typeof OrchestrationResultSchema>;

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

export function validateRequest(input: unknown): OrchestrationRequest {
  return OrchestrationRequestSchema.parse(input);
}

export function validateAgentResponse(input: unknown): AgentResponse {
  return AgentResponseSchema.parse(input);
}
