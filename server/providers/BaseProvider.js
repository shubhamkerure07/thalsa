/**
 * Base AI Provider Interface
 * All AI providers (Google, Groq, Cerebras, OpenAI, Anthropic, etc.) extend this class
 */
class BaseAIProvider {
  constructor(config = {}) {
    this.id = config.id || 'base';
    this.name = config.name || 'Base Provider';
    this.modelName = config.modelName || 'Base Model';
    this.apiKey = config.apiKey || null;
    this.costTier = config.costTier || 'efficient';
  }

  isConfigured() {
    return Boolean(this.apiKey && typeof this.apiKey === 'string' && this.apiKey.trim().length > 0);
  }

  /**
   * Main query method
   * Must return: { text, model, provider, latency }
   * Throws an Error if not configured or if API fails.
   * NEVER returns fake/mock content.
   *
   * @param {string} prompt - User question
   * @param {object} options - Optional parameters
   * @returns {Promise<{ text: string, model: string, provider: string, latency: number }>}
   */
  async generateResponse({ prompt, model, options = {} }) {
    throw new Error(`generateResponse() not implemented for ${this.name}`);
  }

  // Backward compatibility alias for query
  async query(prompt, options = {}) {
    return this.generateResponse({ prompt, model: this.modelName, options });
  }
}

module.exports = BaseAIProvider;
