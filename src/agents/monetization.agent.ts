import { BaseAgent } from "./base.agent";
import { AgentInput, AgentOutput } from "./agent.types";
import { LLMService } from "../llm/llm.service.v2";

export class MonetizationAgent extends BaseAgent {
  private llm = new LLMService();

  constructor() {
    super(
      "monetization-agent",
      "Monetization Agent",
      "Generates structured, sellable strategy reports"
    );
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const prompt = `
You are a business strategist.

Task:
${input.task}

Return a PAID-GRADE REPORT with:

1. Business Model
2. Revenue Streams (ranked)
3. Pricing Strategy
4. Customer Acquisition Plan
5. Execution Plan (step-by-step)
6. Risks + Mitigation
7. 30-Day Action Plan

Format clean, structured, and professional.
`;

    const response = await this.llm.generate(prompt);

    return {
      result: response,
      metadata: {
        product: "Monetization Report",
        agent: this.name
      }
    };
  }
}
