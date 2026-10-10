const { searchWikipedia } = require('./WikipediaProvider');
const { searchWikidata } = require('./WikidataProvider');
const { searchStackExchange } = require('./StackExchangeProvider');
const { searchOpenAlex } = require('./OpenAlexProvider');
const { searchWeather } = require('./WeatherProvider');
const { searchFinance } = require('./FinanceProvider');
const { searchTechNews } = require('./HackerNewsProvider');
const { searchPublicApisForQuery } = require('./PublicApisCatalog');

/**
 * In-memory TTL cache to keep THALSA lightning-fast and respect public API rate limits
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
 * Intelligent question classifier to route queries to the best public API sources
 */
function classifyQuestion(question) {
  const q = question.toLowerCase();

  const isWeather = /\b(weather|temperature|forecast|rain|raining|humidity|wind speed|climate in|degrees in)\b/.test(q);
  const isFinance = /\b(crypto|bitcoin|btc|ethereum|eth|solana|sol|doge|dogecoin|currency|exchange rate|usd to inr|eur to usd|forex|stock|price of btc|price of bitcoin)\b/.test(q);
  const isTechNews = /\b(hacker news|hackernews|tech news|trending in tech|tech headlines|latest engineering news)\b/.test(q);
  const isApiDirectory = /\b(public api|public apis|free api|free apis|api for|apis for|endpoint for|recommend an api)\b/.test(q);

  const isCoding = /\b(code|c program|pointer|pointers|c\+\+|python|java|javascript|function|syntax|error|segfault|memory leak|recursion|array|loop|compiler|debugging)\b/.test(q);
  const isMath = /\b(math|mathematics|integral|integration|derivative|differentiation|calculus|laplace|equation|solve|matrix|algebra|trigonometry)\b/.test(q);
  const isEngineering = /\b(kirchhoff|voltage|current|circuit|laws|ohm|resistor|capacitor|thermodynamics|physics|frequency|hertz|wavelength|transistor|signal)\b/.test(q);
  const isResearch = /\b(research|paper|studies|scholarly|literature|meta-analysis|trends|history of|future of)\b/.test(q);
  const isExam = /\b(exam|marks|mark|5-mark|8-mark|2-mark|10-mark|syllabus|notes)\b/.test(q);

  let category = 'general_concept';
  if (isApiDirectory) category = 'api_directory';
  else if (isWeather) category = 'weather';
  else if (isFinance) category = 'finance';
  else if (isTechNews) category = 'tech_news';
  else if (isCoding) category = 'coding';
  else if (isMath) category = 'mathematics';
  else if (isEngineering) category = 'engineering';
  else if (isResearch) category = 'research';

  return {
    category,
    isWeather,
    isFinance,
    isTechNews,
    isApiDirectory,
    isCoding,
    isMath,
    isEngineering,
    isResearch,
    isExam
  };
}

/**
 * Gathers relevant knowledge automatically across curated Public APIs & reference databases
 */
async function retrieveKnowledge(question) {
  const cacheKey = question.trim().toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const classification = classifyQuestion(question);
  const sourcesPromises = [];

  // Automated source prioritization (v2 Multi-API Dispatcher):
  // 1. Live Weather Grounding (Open-Meteo)
  if (classification.isWeather) {
    sourcesPromises.push(searchWeather(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 2. Live Financial Grounding (CoinGecko / Exchange Rates)
  else if (classification.isFinance) {
    sourcesPromises.push(searchFinance(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 3. Live Tech News (HackerNews)
  else if (classification.isTechNews) {
    sourcesPromises.push(searchTechNews(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 4. Public APIs Directory & Recommendations
  else if (classification.isApiDirectory) {
    sourcesPromises.push(searchPublicApisForQuery(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 5. Coding & Algorithms (Stack Exchange + Wikipedia)
  else if (classification.isCoding) {
    sourcesPromises.push(searchStackExchange(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 6. Research & Scientific Papers (OpenAlex + Wikipedia)
  else if (classification.isResearch) {
    sourcesPromises.push(searchOpenAlex(question));
    sourcesPromises.push(searchWikipedia(question));
  }
  // 7. Engineering & Physics (Wikipedia + Wikidata)
  else if (classification.isEngineering) {
    sourcesPromises.push(searchWikipedia(question));
    sourcesPromises.push(searchWikidata(question));
  }
  // 8. General Concepts & Mathematics (Wikipedia + Wikidata)
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
