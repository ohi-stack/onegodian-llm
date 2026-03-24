import { Agent, AgentInput, AgentOutput } from "./agent.types";

export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  description: string;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  abstract execute(input: AgentInput): Promise<AgentOutput>;
}
