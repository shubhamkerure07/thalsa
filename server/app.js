require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const providerManager = require('./providers/ProviderManager');
const db = require('./db/database');
const { processStudentQuestion } = require('./engine/ThalsaOrchestrator');
const { getAllApis, getCategories, searchApis } = require('./knowledge/PublicApisCatalog');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory rate limiting (max 60 requests per minute per IP)
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const userRecord = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userRecord.resetTime) {
    userRecord.count = 1;
    userRecord.resetTime = now + windowMs;
  } else {
    userRecord.count++;
  }

  rateLimitMap.set(ip, userRecord);

  if (userRecord.count > 60) {
    return res.status(429).json({ error: 'Too many requests. Please pause for a moment.' });
  }

  next();
});

// GET /api/models - List configured providers
app.get('/api/models', (req, res) => {
  try {
    const models = providerManager.getAllProviders();
    const configuredCount = models.filter(m => m.isConfigured).length;
    res.json({
      models,
      configuredCount,
      totalCount: models.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public-apis - List and search curated public APIs (v2 feature)
app.get('/api/public-apis', (req, res) => {
  try {
    const { q = '', category = '' } = req.query;
    const apis = searchApis(q, category);
    res.json({
      count: apis.length,
      apis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public-apis/categories - List available public API categories
app.get('/api/public-apis/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ask - Primary THALSA Student & Knowledge Assistant Endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const { question, mode = 'standard', examMarks = null, isStudyMode = false, previousContext = '' } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question to ask THALSA.' });
    }

    const trimmedQuestion = question.trim();

    // Process through THALSA student orchestrator
    const result = await processStudentQuestion(trimmedQuestion, {
      mode,
      examMarks,
      isStudyMode,
      previousContext
    });

    // Save to conversation history database
    const conversationId = crypto.randomUUID();
    db.saveConversation({
      id: conversationId,
      question: trimmedQuestion,
      mode: isStudyMode ? 'study' : examMarks ? `exam-${examMarks}m` : mode,
      final_answer: result.answer,
      agreement_score: 100,
      agreement_details: JSON.stringify({
        keyPoints: result.keyPoints,
        sourcesUsed: result.sourcesUsed,
        engine: result.engine
      }),
      created_at: new Date().toISOString()
    });

    res.json({
      id: conversationId,
      ...result
    });
  } catch (err) {
    console.error('Ask endpoint error:', err);
    res.status(500).json({ error: err.message || 'Server error processing your question.' });
  }
});

// POST /api/compare - Compatibility endpoint for multi-model comparisons
app.post('/api/compare', async (req, res) => {
  try {
    const { question, mode = 'compare', selectedModels = [] } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'A question is required.' });
    }

    const trimmedQuestion = question.trim();
    const allProviders = providerManager.getAllProviders();
    const configuredList = allProviders.filter(p => p.isConfigured).map(p => p.id);

    let requested = Array.isArray(selectedModels) && selectedModels.length > 0
      ? selectedModels
      : (configuredList.length > 0 ? configuredList : ['gemini', 'groq']);

    let modelsToQuery = requested.slice(0, mode === 'fast' ? 1 : mode === 'deep' ? 3 : 2);
    if (modelsToQuery.length === 0) modelsToQuery = ['gemini'];

    const responses = await providerManager.queryModels(trimmedQuestion, modelsToQuery);
    const synthesis = await providerManager.synthesizeFinalAnswer(trimmedQuestion, responses);

    const conversationId = crypto.randomUUID();
    db.saveConversation({
      id: conversationId,
      question: trimmedQuestion,
      mode,
      final_answer: synthesis.finalAnswer,
      agreement_score: synthesis.agreementScore,
      agreement_details: JSON.stringify(synthesis.agreementBreakdown),
      created_at: new Date().toISOString()
    });

    for (const r of responses) {
      db.saveResponse({
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        provider_id: r.providerId,
        model_name: r.modelName,
        provider_name: r.providerName,
        response: r.response,
        response_time_ms: r.responseTimeMs,
        status: r.status,
        error_message: r.error || null,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      id: conversationId,
      question: trimmedQuestion,
      mode,
      responses,
      finalAnswer: synthesis.finalAnswer,
      agreementScore: synthesis.agreementScore,
      agreementBreakdown: synthesis.agreementBreakdown,
      synthesizer: synthesis.synthesizer || null,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: err.message || 'Server error occurred during comparison.' });
  }
});

// GET /api/history - Get past questions list
app.get('/api/history', (req, res) => {
  try {
    const list = db.getRecentConversations(40);
    res.json({ history: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:id - Fetch past question with details
app.get('/api/history/:id', (req, res) => {
  try {
    const item = db.getConversationWithResponses(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    let parsedMeta = {};
    try {
      if (item.agreement_details) {
        parsedMeta = JSON.parse(item.agreement_details);
      }
    } catch (e) {}

    res.json({
      id: item.id,
      question: item.question,
      mode: item.mode,
      answer: item.final_answer,
      finalAnswer: item.final_answer,
      keyPoints: parsedMeta.keyPoints || [],
      sourcesUsed: parsedMeta.sourcesUsed || [],
      engine: parsedMeta.engine || 'THALSA Engine',
      createdAt: item.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id - Delete single item
app.delete('/api/history/:id', (req, res) => {
  try {
    db.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history - Clear all history
app.delete('/api/history', (req, res) => {
  try {
    db.clearAllHistory();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/keys - Dynamic runtime API keys
app.post('/api/settings/keys', (req, res) => {
  try {
    const { geminiKey, groqKey, cerebrasKey, openaiKey, anthropicKey } = req.body;
    providerManager.updateKeys({ geminiKey, groqKey, cerebrasKey, openaiKey, anthropicKey });
    res.json({
      success: true,
      models: providerManager.getAllProviders()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client fallback route for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
