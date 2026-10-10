const BaseAIProvider = require('./BaseProvider');

class GoogleProvider extends BaseAIProvider {
  constructor(apiKey) {
    super({
      id: 'gemini',
      name: 'Gemini',
      modelName: 'Gemini 1.5 Flash',
      apiKey: apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY,
      costTier: 'fast'
    });
  }

  async generateResponse({ prompt, model, options = {} }) {
    const activeModel = model || 'gemini-1.5-flash';
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new Error('Gemini is not configured. Add GEMINI_API_KEY to the server environment.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 1024,
          temperature: options.temperature !== undefined ? options.temperature : 0.4
        }
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Google Gemini API returned status ${response.status}`;
      throw new Error(`Gemini error: ${msg}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      throw new Error('Gemini returned an empty response candidate.');
    }

    return {
      text: text.trim(),
      model: this.modelName,
      provider: this.name,
      latency
    };
  }
}

module.exports = GoogleProvider;
