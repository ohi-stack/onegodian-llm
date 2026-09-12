import { runOpenAI } from '../providers/openai';

export class OpenAIService {
  async generate(prompt: string): Promise<string> {
    return runOpenAI(prompt);
  }
}
