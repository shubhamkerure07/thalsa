const { fetchJson } = require('./httpUtil');

/**
 * Searches OpenAlex for scholarly works, scientific research papers, and academic context
 */
async function searchOpenAlex(query) {
  try {
    const cleanQuery = query
      .replace(/(find research about|papers on|research on|explain|what is|how does)/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    const encoded = encodeURIComponent(cleanQuery || query);
    const searchUrl = `https://api.openalex.org/works?search=${encoded}&per-page=2`;
    const data = await fetchJson(searchUrl, { timeout: 7000 });

    const results = data?.results || [];
    if (results.length === 0) return null;

    const top = results[0];
    let reconstructedAbstract = '';

    // OpenAlex returns abstracts as inverted index
    if (top.abstract_inverted_index) {
      try {
        const wordPositions = [];
        for (const [word, positions] of Object.entries(top.abstract_inverted_index)) {
          for (const pos of positions) {
            wordPositions.push({ word, pos });
          }
        }
        wordPositions.sort((a, b) => a.pos - b.pos);
        reconstructedAbstract = wordPositions.slice(0, 80).map(item => item.word).join(' ') + '...';
      } catch (e) {}
    }

    return {
      source: 'OpenAlex',
      title: top.title,
      publicationYear: top.publication_year,
      citedByCount: top.cited_by_count,
      authors: (top.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean),
      abstractSnippet: reconstructedAbstract,
      url: top.doi || top.id
    };
  } catch (err) {
    return null;
  }
}

module.exports = { searchOpenAlex };
