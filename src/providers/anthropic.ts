import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runAnthropic(prompt: string): Promise<string> {
  const res = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  return res.content[0]?.text || "";
}
