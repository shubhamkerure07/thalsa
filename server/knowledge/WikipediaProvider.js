const { fetchJson } = require('./httpUtil');

/**
 * Strips HTML tags and clean formatting
 */
function cleanText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches and extracts authoritative summaries from Wikipedia
 */
async function searchWikipedia(query) {
  try {
    const encoded = encodeURIComponent(query);
    // 1. Search for best matching page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&utf8=&format=json&srlimit=3`;
    const searchData = await fetchJson(searchUrl, { timeout: 6000 });

    const hits = searchData?.query?.search || [];
    if (hits.length === 0) return null;

    const topHit = hits[0];
    const pageTitle = encodeURIComponent(topHit.title);

    // 2. Fetch page summary extract
    const extractUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`;
    const summary = await fetchJson(extractUrl, { timeout: 6000 }).catch(() => null);

    if (summary && summary.extract) {
      return {
        source: 'Wikipedia',
        title: summary.title,
        description: summary.description || '',
        extract: summary.extract,
        url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${pageTitle}`
      };
    }

    // Fallback to snippet from search hit
    return {
      source: 'Wikipedia',
      title: topHit.title,
      description: '',
      extract: cleanText(topHit.snippet),
      url: `https://en.wikipedia.org/wiki/${pageTitle}`
    };
  } catch (err) {
    // Graceful background tolerance
    return null;
  }
}

module.exports = { searchWikipedia };
