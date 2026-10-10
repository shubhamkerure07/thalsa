const BaseAIProvider = require('./BaseProvider');

class CerebrasProvider extends BaseAIProvider {
  constructor(apiKey) {
    super({
      id: 'cerebras',
      name: 'Cerebras',
      modelName: 'Llama 3.1 8B',
      apiKey: apiKey !== undefined ? apiKey : process.env.CEREBRAS_API_KEY,
      costTier: 'ultra-fast'
    });
  }

  async generateResponse({ prompt, model, options = {} }) {
    const activeModel = model || 'llama3.1-8b';
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error('Cerebras is not configured. Add CEREBRAS_API_KEY to the server environment.');
    }

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          {
            role: 'system',
            content: 'You are a precise, articulate, and accurate AI assistant. Answer directly and concisely.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature !== undefined ? options.temperature : 0.4
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Cerebras API returned status ${response.status}`;
      throw new Error(`Cerebras error: ${msg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text || typeof text !== 'string') {
      throw new Error('Cerebras returned an empty response.');
    }

    return {
      text: text.trim(),
      model: this.modelName,
      provider: this.name,
      latency
    };
  }
}

module.exports = CerebrasProvider;
