const BaseAIProvider = require('./BaseProvider');

class GroqProvider extends BaseAIProvider {
  constructor(apiKey) {
    super({
      id: 'groq',
      name: 'Groq',
      modelName: 'Llama 3.3 70B',
      apiKey: apiKey !== undefined ? apiKey : process.env.GROQ_API_KEY,
      costTier: 'ultra-fast'
    });
  }

  async generateResponse({ prompt, model, options = {} }) {
    const activeModel = model || 'llama-3.3-70b-versatile';
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error('Groq is not configured. Add GROQ_API_KEY to the server environment.');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      const msg = errorData.error?.message || `Groq API returned status ${response.status}`;
      throw new Error(`Groq error: ${msg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text || typeof text !== 'string') {
      throw new Error('Groq returned an empty response.');
    }

    return {
      text: text.trim(),
      model: this.modelName,
      provider: this.name,
      latency
    };
  }
}

module.exports = GroqProvider;
