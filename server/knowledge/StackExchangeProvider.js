const { fetchJson } = require('./httpUtil');

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Searches Stack Exchange (Stack Overflow) for coding concepts, bug diagnoses, and engineering answers
 */
async function searchStackExchange(query, tags = '') {
  try {
    // Simplify query for Stack Overflow search
    const cleanQuery = query
      .replace(/(explain|how to|what is|why does|solve|fix|this|in simple terms)/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    const encoded = encodeURIComponent(cleanQuery || query);
    const searchUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encoded}&site=stackoverflow&filter=withbody&pagesize=2`;

    const data = await fetchJson(searchUrl, { timeout: 7000 });
    const items = data?.items || [];
    if (items.length === 0) return null;

    const topItem = items[0];
    let topAnswerBody = '';

    // If accepted answer exists, try to get its body
    if (topItem.accepted_answer_id) {
      try {
        const ansUrl = `https://api.stackexchange.com/2.3/answers/${topItem.accepted_answer_id}?site=stackoverflow&filter=withbody`;
        const ansData = await fetchJson(ansUrl, { timeout: 6000 });
        if (ansData?.items?.[0]?.body) {
          topAnswerBody = cleanHtml(ansData.items[0].body);
        }
      } catch (e) {
        // Fallback to question body
      }
    }

    return {
      source: 'Stack Exchange',
      title: topItem.title,
      questionSnippet: cleanHtml(topItem.body).slice(0, 400),
      answerSnippet: topAnswerBody ? topAnswerBody.slice(0, 900) : '',
      tags: topItem.tags || [],
      url: topItem.link
    };
  } catch (err) {
    return null;
  }
}

module.exports = { searchStackExchange };
