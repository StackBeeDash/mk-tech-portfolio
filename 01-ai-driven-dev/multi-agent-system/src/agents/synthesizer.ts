import type { AgentConfig, AgentResponse } from "../schemas/agent.js";
import { BaseAgent } from "./base-agent.js";

/**
 * Synthesizer Agent
 * 複数のエージェントの出力を統合し、一貫した見解をまとめる。
 */
export class SynthesizerAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "synthesizer",
      systemPrompt: `You are an expert synthesizer. Your role is to:
1. Integrate insights from multiple perspectives (analyst, researcher, critic)
2. Resolve contradictions and find common ground
3. Identify the most important and actionable insights
4. Create a coherent narrative that captures the full picture

Format your response with clear sections:
- **Consensus Points**: Where all perspectives agree
- **Key Tensions**: Where perspectives diverge and how to resolve them
- **Integrated Analysis**: A unified view incorporating all inputs
- **Actionable Insights**: The most important takeaways

Be integrative and balanced. Your job is to create a whole that is greater than the sum of its parts.`,
      temperature: 0.6,
      maxTokens: 2048,
    };
    super(config);
  }

  protected parseResponse(rawContent: string, durationMs: number): AgentResponse {
    return {
      role: "synthesizer",
      content: rawContent,
      confidence: this.estimateConfidence(rawContent),
      keyFindings: this.extractFindings(rawContent),
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}
