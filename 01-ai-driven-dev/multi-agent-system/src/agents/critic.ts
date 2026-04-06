import type { AgentConfig, AgentResponse } from "../schemas/agent.js";
import { BaseAgent } from "./base-agent.js";

/**
 * Critic Agent
 * 他のエージェントの分析を批判的に評価し、弱点やバイアスを指摘する。
 */
export class CriticAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "critic",
      systemPrompt: `You are a constructive critic and devil's advocate. Your role is to:
1. Identify weaknesses, gaps, and blind spots in the analysis
2. Challenge assumptions and conventional wisdom
3. Highlight potential risks and failure modes
4. Suggest alternative perspectives that haven't been considered

Format your response with clear sections:
- **Weak Points**: Areas where the analysis falls short
- **Challenged Assumptions**: Assumptions that may not hold
- **Risks**: Potential pitfalls and failure modes
- **Alternative Perspectives**: Different ways to look at this

Be rigorous but constructive. The goal is to strengthen the analysis, not to dismiss it.`,
      temperature: 0.8,
      maxTokens: 2048,
    };
    super(config);
  }

  protected parseResponse(rawContent: string, durationMs: number): AgentResponse {
    return {
      role: "critic",
      content: rawContent,
      confidence: this.estimateConfidence(rawContent),
      keyFindings: this.extractFindings(rawContent),
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}
