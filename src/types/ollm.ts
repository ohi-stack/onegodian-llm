export type OLLMPlan = "free" | "professional" | "business";

export type ProviderExecutionStatus =
  | "queued"
  | "running"
  | "complete"
  | "timeout"
  | "failed";

export type OLLMExecutionStatus = "complete" | "partial" | "failed";

export interface OLLMModelSelection {
  provider: string;
  model: string;
}

export interface OLLMSynthesisRequest {
  prompt: string;
  models: OLLMModelSelection[];
  conversationId?: string;
  options?: {
    save?: boolean;
  };
}

export interface OLLMProviderResult {
  provider: string;
  model: string;
  status: ProviderExecutionStatus;
  content: string | null;
  latencyMs?: number;
  errorCode?: string;
}

export interface OLLMGovernanceResult {
  pipeline: [
    "collect",
    "normalize",
    "analyze",
    "synthesize",
    "validate",
    "output"
  ];
  warnings: string[];
  validation: {
    passed: boolean;
  };
}

export interface OLLMSynthesisResponse {
  executionId: string;
  status: OLLMExecutionStatus;
  models: OLLMProviderResult[];
  governance: OLLMGovernanceResult;
  synthesis: {
    content: string;
    status: "complete" | "degraded";
  };
  createdAt: string;
}
