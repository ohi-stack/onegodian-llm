import { ModelKey } from "../types";

export async function runMockModel(
  model: ModelKey,
  prompt: string
): Promise<string> {
  return `[${model.toUpperCase()} RESPONSE]\n\nPrompt: ${prompt}\n\nAnswer:\nOneGodian represents unity, synthesis, and structured intelligence across systems.`;
}
