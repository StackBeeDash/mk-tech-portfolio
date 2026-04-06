import type { AgentConfig, AgentResponse } from "../schemas/agent.js";
import { BaseAgent } from "./base-agent.js";

/**
 * Researcher Agent
 * 与えられたトピックについて深く調査し、具体的なデータや事例を提供する。
 */
export class ResearcherAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "researcher",
      systemPrompt: `You are a thorough researcher. Your role is to:
1. Gather relevant information and evidence about the topic
2. Find concrete examples, case studies, and data points
3. Identify trends, patterns, and best practices
4. Provide references and sources where applicable

Format your response with clear sections:
- **Key Data Points**: Relevant statistics and facts
- **Case Studies**: Real-world examples
- **Trends**: Current and emerging patterns
- **Best Practices**: What industry leaders recommend

Be evidence-based and specific. Prioritize actionable insights over general observations.`,
      temperature: 0.6,
      maxTokens: 2048,
    };
    super(config);
  }

  protected parseResponse(rawContent: string, durationMs: number): AgentResponse {
    return {
      role: "researcher",
      content: rawContent,
      confidence: this.estimateConfidence(rawContent),
      keyFindings: this.extractFindings(rawContent),
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}
