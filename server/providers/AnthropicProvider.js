const BaseAIProvider = require('./BaseProvider');

class AnthropicProvider extends BaseAIProvider {
  constructor(apiKey) {
    super({
      id: 'anthropic',
      name: 'Claude',
      modelName: 'Claude 3.5 Haiku',
      apiKey: apiKey !== undefined ? apiKey : process.env.ANTHROPIC_API_KEY,
      costTier: 'low-cost-fast'
    });
  }

  async generateResponse({ prompt, model, options = {} }) {
    const activeModel = model || 'claude-3-5-haiku-latest';
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error('Claude is not configured. Add ANTHROPIC_API_KEY to the server environment.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature !== undefined ? options.temperature : 0.5,
        system: 'You are an intelligent, nuanced, and precise assistant. Deliver direct, articulate answers with elegant clarity and actionable takeaways.'
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Anthropic API returned status ${response.status}`;
      throw new Error(`Claude error: ${msg}`);
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text).join('\n');

    if (!text || typeof text !== 'string') {
      throw new Error('Claude returned an empty response.');
    }

    return {
      text: text.trim(),
      model: this.modelName,
      provider: this.name,
      latency
    };
  }
}

module.exports = AnthropicProvider;
