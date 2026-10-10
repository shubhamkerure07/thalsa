const { searchWikipedia } = require('./WikipediaProvider');
const { searchWikidata } = require('./WikidataProvider');
const { searchStackExchange } = require('./StackExchangeProvider');
const { searchOpenAlex } = require('./OpenAlexProvider');

/**
 * In-memory TTL cache to keep LUMIQ lightning-fast and respect public API rate limits
 */
const knowledgeCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
  const item = knowledgeCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    knowledgeCache.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value) {
  knowledgeCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Intelligent question classifier to decide which sources are needed
 */
function classifyQuestion(question) {
  const q = question.toLowerCase();

  const isCoding = /\b(code|c program|pointer|pointers|c\+\+|python|java|javascript|function|syntax|error|segfault|memory leak|recursion|array|loop|compiler|debugging)\b/.test(q);
  const isMath = /\b(math|mathematics|integral|integration|derivative|differentiation|calculus|laplace|equation|solve|matrix|algebra|trigonometry)\b/.test(q);
  const isEngineering = /\b(kirchhoff|voltage|current|circuit|laws|ohm|resistor|capacitor|thermodynamics|physics|frequency|hertz|wavelength|transistor|signal)\b/.test(q);
  const isResearch = /\b(research|paper|studies|scholarly|literature|meta-analysis|trends|history of|future of)\b/.test(q);
  const isExam = /\b(exam|marks|mark|5-mark|8-mark|2-mark|10-mark|syllabus|notes)\b/.test(q);

  let category = 'general_concept';
  if (isCoding) category = 'coding';
  else if (isMath) category = 'mathematics';
  else if (isEngineering) category = 'engineering';
  else if (isResearch) category = 'research';

  return {
    category,
    isCoding,
    isMath,
    isEngineering,
    isResearch,
    isExam
  };
}

/**
 * Gathers relevant knowledge automatically without student intervention
 */
async function retrieveKnowledge(question) {
  const cacheKey = question.trim().toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const classification = classifyQuestion(question);
  const sourcesPromises = [];

  // Automated source prioritization:
  // 1. Coding: Stack Exchange + Wikipedia
  if (classification.isCoding) {
    sourcesPromises.push(searchStackExchange(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 2. Research: OpenAlex + Wikipedia
  else if (classification.isResearch) {
    sourcesPromises.push(searchOpenAlex(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 3. Engineering & Physics: Wikipedia + Wikidata
  else if (classification.isEngineering) {
    sourcesPromises.push(searchWikipedia(question));
    sourcesPromises.push(searchWikidata(question));
  }
  // 4. Mathematics & General Concepts: Wikipedia + Wikidata
  else {
    sourcesPromises.push(searchWikipedia(question));
    sourcesPromises.push(searchWikidata(question));
  }

  // Await selected sources
  const results = await Promise.all(sourcesPromises);
  const validSources = results.filter(Boolean);

  const gathered = {
    classification,
    sources: validSources
  };

  setCache(cacheKey, gathered);
  return gathered;
}

module.exports = {
  retrieveKnowledge,
  classifyQuestion
};
