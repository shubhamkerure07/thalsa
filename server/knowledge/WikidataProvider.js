const { fetchJson } = require('./httpUtil');

/**
 * Searches Wikidata entities for structured knowledge, claims, and entity definitions
 */
async function searchWikidata(query) {
  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encoded}&language=en&format=json&limit=2`;
    const data = await fetchJson(searchUrl, { timeout: 6000 });

    const hits = data?.search || [];
    if (hits.length === 0) return null;

    const hit = hits[0];
    return {
      source: 'Wikidata',
      id: hit.id,
      label: hit.label,
      description: hit.description || '',
      url: hit.concepturi || `https://www.wikidata.org/wiki/${hit.id}`
    };
  } catch (err) {
    return null;
  }
}

module.exports = { searchWikidata };
