import { backendConfigured, chatCompletion } from '../runtime/backend';
import { runtimeConfig } from '../runtime/config';

export class LLMService {
  async generate(prompt: string): Promise<string> {
    if (backendConfigured()) {
      const completion: any = await chatCompletion({
        messages: [{ role: 'user', content: prompt }]
      });
      const content = completion?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('ollm_backend_completion_content_missing');
      return content;
    }

    if (runtimeConfig.NODE_ENV === 'production') {
      throw new Error('ollm_backend_not_configured');
    }

    return `[SIMULATION — NO MODEL BACKEND]\n${prompt}`;
  }
}
