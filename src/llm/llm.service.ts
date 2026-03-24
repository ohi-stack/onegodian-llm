export class LLMService {
  async generate(prompt: string): Promise<string> {
    return `LLM RESPONSE:\n${prompt}`;
  }
}
