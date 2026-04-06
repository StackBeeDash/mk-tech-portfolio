import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig, AgentResponse, AgentRole } from "../schemas/agent.js";

// ---------------------------------------------------------------------------
// Base Agent — 全エージェントの共通基盤
// ---------------------------------------------------------------------------

export abstract class BaseAgent {
  protected client: Anthropic;
  protected config: AgentConfig;

  constructor(config: AgentConfig, client?: Anthropic) {
    this.config = config;
    // ANTHROPIC_API_KEY 環境変数から自動的に取得される
    this.client = client ?? new Anthropic();
  }

  get role(): AgentRole {
    return this.config.role;
  }

  /**
   * エージェントにタスクを実行させる
   */
  async execute(topic: string, context?: string): Promise<AgentResponse> {
    const startTime = Date.now();

    const userMessage = context
      ? `Topic: ${topic}\n\nContext from other agents:\n${context}`
      : `Topic: ${topic}`;

    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.config.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const durationMs = Date.now() - startTime;

    return this.parseResponse(content, durationMs);
  }

  /**
   * レスポンスを構造化データにパースする（各エージェントで実装）
   */
  protected abstract parseResponse(
    rawContent: string,
    durationMs: number
  ): AgentResponse;

  /**
   * コンテンツから key findings を抽出するユーティリティ
   */
  protected extractFindings(content: string): string[] {
    const lines = content.split("\n");
    const findings: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // "- " や "* " で始まる行、または "1. " 等の番号付きリストを抽出
      if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        findings.push(trimmed.replace(/^[-*\d.]+\s+/, ""));
      }
    }

    return findings.slice(0, 5); // 最大5つ
  }

  /**
   * 信頼度を推定する（明示的な指標がない場合のヒューリスティック）
   */
  protected estimateConfidence(content: string): number {
    const hedgingWords = [
      "might",
      "perhaps",
      "possibly",
      "unclear",
      "uncertain",
      "maybe",
    ];
    const confidenceWords = [
      "clearly",
      "definitely",
      "certainly",
      "strongly",
      "evidence shows",
    ];

    let score = 0.7; // ベースライン

    for (const word of hedgingWords) {
      if (content.toLowerCase().includes(word)) score -= 0.05;
    }
    for (const word of confidenceWords) {
      if (content.toLowerCase().includes(word)) score += 0.05;
    }

    return Math.max(0.1, Math.min(1.0, score));
  }
}
