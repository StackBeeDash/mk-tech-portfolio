import type { AgentConfig, AgentResponse } from "../schemas/agent.js";
import { BaseAgent } from "./base-agent.js";

/**
 * Reporter Agent
 * 最終的な分析結果を、読み手にとって分かりやすいレポート形式にまとめる。
 */
export class ReporterAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      role: "reporter",
      systemPrompt: `You are an expert report writer. Your role is to:
1. Transform the synthesized analysis into a clear, actionable report
2. Write for a decision-maker audience (executives, tech leads)
3. Include an executive summary, key findings, and recommendations
4. Keep the language clear and jargon-free

Format your response as a structured report:
- **Executive Summary**: 2-3 sentence overview
- **Key Findings**: Numbered list of the most important discoveries
- **Analysis**: Detailed discussion of findings
- **Recommendations**: Specific, actionable next steps
- **Risks & Mitigations**: What could go wrong and how to prevent it

Be clear, concise, and action-oriented. The reader should know exactly what to do after reading this report.`,
      temperature: 0.4,
      maxTokens: 3000,
    };
    super(config);
  }

  protected parseResponse(rawContent: string, durationMs: number): AgentResponse {
    return {
      role: "reporter",
      content: rawContent,
      confidence: this.estimateConfidence(rawContent),
      keyFindings: this.extractFindings(rawContent),
      timestamp: new Date().toISOString(),
      durationMs,
    };
  }
}
