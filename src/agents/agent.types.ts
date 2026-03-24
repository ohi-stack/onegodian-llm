export type AgentInput = {
  task: string;
  context?: Record<string, any>;
};

export type AgentOutput = {
  result: string;
  metadata?: Record<string, any>;
};

export interface Agent {
  id: string;
  name: string;
  description: string;

  execute(input: AgentInput): Promise<AgentOutput>;
}
