import { ModelKey } from "../types";
import { runOpenAI } from "./openai";
import { runAnthropic } from "./anthropic";
import { runGemini } from "./gemini";

export async function runModel(model: ModelKey, prompt: string) {
  switch (model) {
    case "openai":
      return runOpenAI(prompt);
    case "anthropic":
      return runAnthropic(prompt);
    case "gemini":
      return runGemini(prompt);
    case "grok":
      return "Grok integration coming next";
    default:
      throw new Error("Unknown model");
  }
}
