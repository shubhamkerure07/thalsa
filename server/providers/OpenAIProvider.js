const BaseAIProvider = require('./BaseProvider');

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey) {
    super({
      id: 'openai',
      name: 'OpenAI',
      modelName: 'GPT-4o mini',
      apiKey: apiKey !== undefined ? apiKey : process.env.OPENAI_API_KEY,
      costTier: 'low-cost-fast'
    });
  }

  async generateResponse({ prompt, model, options = {} }) {
    const activeModel = model || 'gpt-4o-mini';
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error('OpenAI is not configured. Add OPENAI_API_KEY to the server environment.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an intelligent, concise, and structured AI assistant. Provide a direct, factual, and well-organized response without conversational fluff.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature !== undefined ? options.temperature : 0.5
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `OpenAI API returned status ${response.status}`;
      throw new Error(`OpenAI error: ${msg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text || typeof text !== 'string') {
      throw new Error('OpenAI returned an empty response.');
    }

    return {
      text: text.trim(),
      model: this.modelName,
      provider: this.name,
      latency
    };
  }
}

module.exports = OpenAIProvider;
