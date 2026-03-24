import { OpenAIService } from "./openai.service";

export class LLMService {
  private provider: OpenAIService;

  constructor() {
    this.provider = new OpenAIService();
  }

  async generate(prompt: string): Promise<string> {
    return this.provider.generate(prompt);
  }
}
