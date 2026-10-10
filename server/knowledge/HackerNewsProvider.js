const { fetchJson } = require('./httpUtil');

/**
 * Searches top tech discussions via HackerNews Firebase Public API
 * Zero auth required.
 */
async function searchTechNews(query) {
  try {
    const topIds = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 4000 });
    if (!Array.isArray(topIds) || topIds.length === 0) return null;

    // Fetch top 3 items
    const storyPromises = topIds.slice(0, 3).map(id => 
      fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { timeout: 3500 }).catch(() => null)
    );

    const stories = (await Promise.all(storyPromises)).filter(Boolean);
    if (stories.length === 0) return null;

    const listText = stories.map((s, idx) => `${idx + 1}. "${s.title}" (Score: ${s.score || 0}, ${s.by || 'user'})`).join('\n');

    return {
      source: 'HackerNews Public API',
      url: 'https://news.ycombinator.com',
      title: 'Current Tech & Engineering Headlines',
      extract: `Trending topics on HackerNews:\n${listText}`,
      liveData: {
        stories: stories.map(s => ({ title: s.title, url: s.url || `https://news.ycombinator.com/item?id=${s.id}`, score: s.score }))
      }
    };
  } catch (err) {
    console.warn('[HackerNewsProvider] Failed to fetch news:', err.message);
    return null;
  }
}

module.exports = { searchTechNews };
