export type ModelKey = "openai" | "anthropic" | "gemini" | "grok";

export interface ModelResult {
  model: ModelKey;
  output: string;
  score?: number;
}

export interface SynthesisInput {
  prompt: string;
  models: ModelKey[];
}

export interface SynthesisOutput {
  final_answer: string;
  consensus_points: string[];
  disagreements: string[];
  model_outputs: ModelResult[];
}
