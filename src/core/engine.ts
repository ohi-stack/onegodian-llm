import { Agent } from "../agents/agent.types";

export class Engine {
  private agents: Map<string, Agent> = new Map();

  register(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  async run(agentId: string, input: any) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return agent.execute(input);
  }
}
