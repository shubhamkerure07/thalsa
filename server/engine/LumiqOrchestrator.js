const { retrieveKnowledge } = require('../knowledge/KnowledgeCoordinator');
const { formatStudentResponse } = require('./StudentSynthesizer');
const providerManager = require('../providers/ProviderManager');

/**
 * LUMIQ Unified Student Intelligence Orchestrator
 *
 * Flow:
 * 1. Receive question & options (mode, examMarks, isStudyMode, previousContext)
 * 2. Retrieve authoritative external facts from public free sources (Wikipedia, Wikidata, Stack Exchange, OpenAlex)
 * 3. If a real AI provider is configured (e.g. Gemini, Groq, Cerebras), ask it to write the pedagogical explanation using the retrieved facts
 * 4. If no AI key is configured, synthesize cleanly using the transparent knowledge formatting pipeline
 * 5. Return one unified student-friendly answer with transparent sources and smart follow-up suggestions
 */
async function processStudentQuestion(question, options = {}) {
  const startTime = Date.now();
  const trimmed = question.trim();

  // 1. Automatically retrieve relevant facts
  const knowledgeData = await retrieveKnowledge(trimmed);

  // 2. Check if a real AI model is configured on the server
  const configuredProviders = providerManager.getConfiguredProviders();

  if (configuredProviders.length > 0) {
    const aiProvider = configuredProviders[0];
    try {
      const modePrompt = options.examMarks
        ? `Format this as an exam answer for ${options.examMarks} marks with headings: Definition, Main Explanation, Important Points, and Conclusion.`
        : options.isStudyMode
        ? `Behave like an encouraging tutor: Explain simply, give an analogy or example, and conclude with a quick mini-question to test the student's understanding.`
        : options.mode === 'simpler'
        ? `Explain this in very simple, intuitive terms like teaching a beginner student. Use everyday analogies.`
        : `Provide a direct, crystal-clear, student-friendly explanation with headings, formulas (LaTeX if applicable), code blocks if relevant, and concrete examples. Avoid unnecessary corporate fluff or giant walls of text.`;

      const factsContext = knowledgeData.sources.map(s => {
        return `[Source: ${s.source} - ${s.title || s.label || ''}]\n${s.extract || s.answerSnippet || s.description || ''}`;
      }).join('\n\n');

      const systemPrompt = `You are THALSA, a friendly, intelligent AI study and knowledge assistant.
Goal: Give the best possible student-friendly answer.
${modePrompt}

Verified Background Knowledge:
${factsContext}

User Question: "${trimmed}"
${options.previousContext ? `Previous Context:\n${options.previousContext}` : ''}

Respond with:
1. The clear student answer
2. Followed by a section starting with "### KEY POINTS" containing 3-4 bullet points.`;

      const aiResult = await aiProvider.generateResponse({
        prompt: systemPrompt,
        model: aiProvider.modelName,
        options: { maxTokens: 1200, temperature: 0.3 }
      });

      // Split answer and key points
      let answerBody = aiResult.text;
      let keyPoints = [];

      if (answerBody.includes('### KEY POINTS')) {
        const parts = answerBody.split('### KEY POINTS');
        answerBody = parts[0].trim();
        const rawPoints = parts[1].trim();
        keyPoints = rawPoints.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())).map(l => l.replace(/^[-*•\d.]\s*/, '').trim());
      }

      const defaultFollowUps = options.examMarks
        ? ['Explain simpler', 'Give an example', 'Ask follow-up']
        : ['Explain simpler', 'Give example', 'Make 5-mark answer', 'Ask follow-up'];

      return {
        question: trimmed,
        answer: answerBody,
        keyPoints: keyPoints.length > 0 ? keyPoints : [
          'Focus on fundamental principles and clear definitions.',
          'Verify with practical examples and solved steps.'
        ],
        sourcesUsed: knowledgeData.sources.map(s => ({
          name: s.source,
          title: s.title || s.label || s.source,
          url: s.url
        })),
        followUps: defaultFollowUps,
        processingTimeMs: Date.now() - startTime,
        engine: `THALSA Engine with ${aiProvider.name}`
      };
    } catch (err) {
      console.warn('Real AI generation had an issue, falling back to clean verified knowledge synthesis:', err.message);
    }
  }

  // 3. Transparent Zero-Cost Knowledge Synthesizer (Honest, accurate, no fake model claims)
  const syntheticResult = formatStudentResponse(trimmed, knowledgeData, options);

  return {
    question: trimmed,
    answer: syntheticResult.answer,
    keyPoints: syntheticResult.keyPoints,
    sourcesUsed: syntheticResult.sourcesUsed,
    followUps: syntheticResult.followUps,
    processingTimeMs: Date.now() - startTime,
    engine: 'THALSA Intelligence Engine (Public Knowledge Base)'
  };
}

module.exports = { processStudentQuestion };
