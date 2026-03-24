import { SynthesisInput, SynthesisOutput, ModelResult } from "../types";
import { runMockModel } from "../providers/mock";
import { scoreOutput } from "./score";

export async function synthesize(
  input: SynthesisInput
): Promise<SynthesisOutput> {
  const results: ModelResult[] = [];

  for (const model of input.models) {
    const output = await runMockModel(model, input.prompt);
    const score = scoreOutput(output);

    results.push({ model, output, score });
  }

  const sorted = results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const finalAnswer = `\nSynthesized Answer:\n\n${sorted
    .map((r) => r.output)
    .join("\n\n---\n\n")}\n\nConclusion:\nOneGodian represents a synthesis-first intelligence model combining multiple perspectives into a unified answer.\n`;

  return {
    final_answer: finalAnswer,
    consensus_points: [
      "Unity is the central concept",
      "Multiple models improve clarity",
      "Synthesis produces stronger answers",
    ],
    disagreements: [
      "Different emphasis on identity vs system",
      "Variation in explanation depth",
    ],
    model_outputs: results,
  };
}
