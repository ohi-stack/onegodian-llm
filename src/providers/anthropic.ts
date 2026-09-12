function requireAnthropicConfig(): { apiKey: string; model: string; baseUrl: string } {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || '').trim();
  const model = String(process.env.ANTHROPIC_MODEL || '').trim();
  const baseUrl = String(process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/$/, '');
  if (!apiKey) throw new Error('anthropic_not_configured');
  if (!model) throw new Error('anthropic_model_not_configured');
  return { apiKey, model, baseUrl };
}

export async function runAnthropic(prompt: string): Promise<string> {
  const { apiKey, model, baseUrl } = requireAnthropicConfig();
  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const payload: any = await response.json();
  if (!response.ok) throw new Error(`anthropic_http_${response.status}`);
  const textBlock = Array.isArray(payload?.content)
    ? payload.content.find((item: any) => item?.type === 'text' && typeof item.text === 'string')
    : null;
  return textBlock?.text || '';
}
