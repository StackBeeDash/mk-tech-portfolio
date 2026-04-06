import {
  AnalystAgent,
  ResearcherAgent,
  CriticAgent,
  SynthesizerAgent,
  ReporterAgent,
} from "./agents/index.js";
import type {
  AgentResponse,
  OrchestrationRequest,
  OrchestrationResult,
} from "./schemas/agent.js";
import { validateRequest } from "./schemas/agent.js";

// ---------------------------------------------------------------------------
// Multi-Agent Orchestrator
// ---------------------------------------------------------------------------
// 5つのエージェントを協調させて、包括的な意思決定支援を行う。
//
// フロー:
//   Phase 1 (並列): Analyst + Researcher + Critic が独立に分析
//   Phase 2 (逐次): Synthesizer が Phase 1 の結果を統合
//   Phase 3 (逐次): Reporter が最終レポートを生成
// ---------------------------------------------------------------------------

export class MultiAgentOrchestrator {
  private analyst = new AnalystAgent();
  private researcher = new ResearcherAgent();
  private critic = new CriticAgent();
  private synthesizer = new SynthesizerAgent();
  private reporter = new ReporterAgent();

  /**
   * オーケストレーションを実行する
   */
  async run(input: unknown): Promise<OrchestrationResult> {
    const request = validateRequest(input);
    const startTime = Date.now();

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Multi-Agent Analysis: ${request.topic}`);
    console.log(`${"=".repeat(60)}\n`);

    // Phase 1: 3エージェントによる並列分析
    console.log("Phase 1: Parallel analysis (Analyst + Researcher + Critic)...");
    const [analystResult, researcherResult, criticResult] = await Promise.all([
      this.executeWithLogging(this.analyst, request.topic, request.context),
      this.executeWithLogging(this.researcher, request.topic, request.context),
      this.executeWithLogging(this.critic, request.topic, request.context),
    ]);

    // Phase 2: Synthesizer が統合
    console.log("\nPhase 2: Synthesis...");
    const synthesisContext = this.buildSynthesisContext(
      analystResult,
      researcherResult,
      criticResult
    );
    const synthesizerResult = await this.executeWithLogging(
      this.synthesizer,
      request.topic,
      synthesisContext
    );

    // Phase 3: Reporter が最終レポート作成
    console.log("\nPhase 3: Final report...");
    const reportContext = this.buildReportContext(
      analystResult,
      researcherResult,
      criticResult,
      synthesizerResult
    );
    const reporterResult = await this.executeWithLogging(
      this.reporter,
      request.topic,
      reportContext
    );

    const totalDurationMs = Date.now() - startTime;

    const result: OrchestrationResult = {
      topic: request.topic,
      agentResponses: [
        analystResult,
        researcherResult,
        criticResult,
        synthesizerResult,
        reporterResult,
      ],
      synthesis: synthesizerResult.content,
      finalReport: reporterResult.content,
      totalDurationMs,
      timestamp: new Date().toISOString(),
    };

    this.printSummary(result);

    return result;
  }

  /**
   * エージェントを実行し、ログを出力する
   */
  private async executeWithLogging(
    agent: { role: string; execute: (topic: string, context?: string) => Promise<AgentResponse> },
    topic: string,
    context?: string
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log(`  [${agent.role}] Starting...`);

    const result = await agent.execute(topic, context);

    const elapsed = Date.now() - startTime;
    console.log(
      `  [${agent.role}] Done (${elapsed}ms, confidence: ${(result.confidence * 100).toFixed(0)}%)`
    );

    return result;
  }

  /**
   * Phase 1 の結果を Synthesizer 用のコンテキストに変換する
   */
  private buildSynthesisContext(
    analyst: AgentResponse,
    researcher: AgentResponse,
    critic: AgentResponse
  ): string {
    return [
      "=== Analyst's Analysis ===",
      analyst.content,
      `Key findings: ${analyst.keyFindings.join("; ")}`,
      `Confidence: ${(analyst.confidence * 100).toFixed(0)}%`,
      "",
      "=== Researcher's Findings ===",
      researcher.content,
      `Key findings: ${researcher.keyFindings.join("; ")}`,
      `Confidence: ${(researcher.confidence * 100).toFixed(0)}%`,
      "",
      "=== Critic's Review ===",
      critic.content,
      `Key findings: ${critic.keyFindings.join("; ")}`,
      `Confidence: ${(critic.confidence * 100).toFixed(0)}%`,
    ].join("\n");
  }

  /**
   * 全エージェントの結果を Reporter 用のコンテキストに変換する
   */
  private buildReportContext(
    analyst: AgentResponse,
    researcher: AgentResponse,
    critic: AgentResponse,
    synthesizer: AgentResponse
  ): string {
    return [
      "=== Synthesized Analysis ===",
      synthesizer.content,
      "",
      "=== Key Findings from All Agents ===",
      `Analyst: ${analyst.keyFindings.join("; ")}`,
      `Researcher: ${researcher.keyFindings.join("; ")}`,
      `Critic: ${critic.keyFindings.join("; ")}`,
      `Synthesizer: ${synthesizer.keyFindings.join("; ")}`,
    ].join("\n");
  }

  /**
   * 実行結果のサマリを出力する
   */
  private printSummary(result: OrchestrationResult): void {
    console.log(`\n${"=".repeat(60)}`);
    console.log("Orchestration Complete");
    console.log(`${"=".repeat(60)}`);
    console.log(`Topic: ${result.topic}`);
    console.log(`Total duration: ${result.totalDurationMs}ms`);
    console.log(`Agents used: ${result.agentResponses.length}`);
    console.log(
      `Average confidence: ${(
        (result.agentResponses.reduce((sum, r) => sum + r.confidence, 0) /
          result.agentResponses.length) *
        100
      ).toFixed(0)}%`
    );
    console.log(`\n--- Final Report ---\n`);
    console.log(result.finalReport);
  }
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

const topic = process.argv[2];

if (topic) {
  const orchestrator = new MultiAgentOrchestrator();
  orchestrator
    .run({ topic, context: process.argv[3] })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Orchestration failed:", err);
      process.exit(1);
    });
} else {
  console.log("Usage: npx tsx src/orchestrator.ts <topic> [context]");
  console.log('Example: npx tsx src/orchestrator.ts "Should we migrate from REST to GraphQL?"');
}
