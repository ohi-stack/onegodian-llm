import { BaseAgent } from "./base.agent";
import { AgentInput, AgentOutput } from "./agent.types";
import { LLMService } from "../llm/llm.service";

export class StrategyAgent extends BaseAgent {
  private llm = new LLMService();

  constructor() {
    super(
      "strategy-agent",
      "Strategy Agent",
      "Analyzes tasks and provides structured strategic output"
    );
  }

  async execute(input: AgentInput): Promise<AgentOutput> {
    const prompt = `
You are a high-level strategic intelligence system.

Task:
${input.task}

Return:
- Clear breakdown
- Action steps
- Risks
- Opportunities
`;

    const response = await this.llm.generate(prompt);

    return {
      result: response,
      metadata: {
        agent: this.name
      }
    };
  }
}
