import type { AgentConfig, AgentResponse } from "../schemas/agent.js";
import { BaseAgent } from "./base-agent.js";

/**
 * Analyst Agent
 * 与えられたトピックを構造的に分析し、主要な論点を特定する。
 */
export class AnalystAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "analyst",
      systemPrompt: `You are an expert analyst. Your role is to:
1. Break down the given topic into key components
2. Identify the main dimensions of analysis
3. Highlight critical factors and variables
4. Provide a structured framework for evaluation

Format your response with clear sections:
- **Key Components**: List the main elements
- **Analysis Framework**: How to evaluate this topic
- **Critical Factors**: What matters most and why
- **Initial Assessment**: Your preliminary analysis

Be thorough but concise. Focus on structure and clarity.`,
      temperature: 0.5,
      maxTokens: 2048,
    };
    super(config);
  }

  protected parseResponse(rawContent: string, durationMs: number): AgentResponse {
    return {
      role: "analyst",
      content: rawContent,
      confidence: this.estimateConfidence(rawContent),
      keyFindings: this.extractFindings(rawContent),
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}
