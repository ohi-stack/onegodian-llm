function requireOpenAIConfig(): { apiKey: string; model: string; baseUrl: string } {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  const model = String(process.env.OPENAI_MODEL || '').trim();
  const baseUrl = String(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!apiKey) throw new Error('openai_not_configured');
  if (!model) throw new Error('openai_model_not_configured');
  return { apiKey, model, baseUrl };
}

export async function runOpenAI(prompt: string): Promise<string> {
  const { apiKey, model, baseUrl } = requireOpenAIConfig();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
  });

  const payload: any = await response.json();
  if (!response.ok) throw new Error(`openai_http_${response.status}`);
  return payload?.choices?.[0]?.message?.content || '';
}
