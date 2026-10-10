/**
 * Curated catalog of top public APIs ingested from github.com/public-apis/public-apis
 * Filtered for stability, high uptime, and developer utility.
 */

const PUBLIC_APIS_DATABASE = [
  // --- Weather & Environment ---
  {
    name: 'Open-Meteo',
    description: 'Free weather forecast API for non-commercial and commercial use with hourly and daily metrics.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Weather',
    link: 'https://open-meteo.com/en/docs',
    sampleEndpoint: 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m'
  },
  {
    name: 'AirVisual',
    description: 'Air quality index and atmospheric pollution data worldwide.',
    auth: 'apiKey',
    https: true,
    cors: 'yes',
    category: 'Weather',
    link: 'https://www.iqair.com/air-pollution-data-api',
    sampleEndpoint: 'https://api.airvisual.com/v2/nearest_city'
  },

  // --- Finance & Cryptocurrency ---
  {
    name: 'CoinGecko',
    description: 'Live cryptocurrency prices, market cap, volume, and historical trading data across 10,000+ coins.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Finance',
    link: 'https://www.coingecko.com/en/api',
    sampleEndpoint: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
  },
  {
    name: 'Open Exchange Rates (ER-API)',
    description: 'Free foreign exchange rate API with live currency conversions updated daily.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Finance',
    link: 'https://open.er-api.com',
    sampleEndpoint: 'https://open.er-api.com/v6/latest/USD'
  },
  {
    name: 'Frankfurter',
    description: 'Open-source currency data and exchange rates tracked from the European Central Bank.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Finance',
    link: 'https://www.frankfurter.app/docs/',
    sampleEndpoint: 'https://api.frankfurter.app/latest?from=USD'
  },

  // --- Development & Programming ---
  {
    name: 'GitHub REST API',
    description: 'Official API for GitHub users, repositories, commits, pull requests, and releases.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Development',
    link: 'https://docs.github.com/en/rest',
    sampleEndpoint: 'https://api.github.com/users/octocat'
  },
  {
    name: 'StackExchange API',
    description: 'Full programmatic access to questions, answers, and tags from StackOverflow and sister sites.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Development',
    link: 'https://api.stackexchange.com/docs',
    sampleEndpoint: 'https://api.stackexchange.com/2.3/search?order=desc&sort=votes&tagged=c&site=stackoverflow'
  },
  {
    name: 'JSONPlaceholder',
    description: 'Free fake REST API for prototyping and testing front-end applications.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Development',
    link: 'https://jsonplaceholder.typicode.com',
    sampleEndpoint: 'https://jsonplaceholder.typicode.com/posts/1'
  },
  {
    name: 'IPify',
    description: 'Simple public IP address lookup API.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Development',
    link: 'https://www.ipify.org',
    sampleEndpoint: 'https://api.ipify.org?format=json'
  },

  // --- Science & Academic ---
  {
    name: 'OpenAlex',
    description: 'Massive open catalog of 250M+ scholarly scientific papers, authors, citations, and institutions.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Science',
    link: 'https://openalex.org',
    sampleEndpoint: 'https://api.openalex.org/works?search=quantum+computing'
  },
  {
    name: 'NASA Open APIs',
    description: 'Astronomy Picture of the Day (APOD), Mars Rover Photos, asteroids, and satellite imagery.',
    auth: 'apiKey',
    https: true,
    cors: 'yes',
    category: 'Science',
    link: 'https://api.nasa.gov',
    sampleEndpoint: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
  },
  {
    name: 'arXiv API',
    description: 'Search and download metadata for academic preprints in physics, CS, math, and AI.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Science',
    link: 'https://arxiv.org/help/api',
    sampleEndpoint: 'http://export.arxiv.org/api/query?search_query=all:electron'
  },
  {
    name: 'Wikidata SPARQL / REST',
    description: 'Structured semantic knowledge graph with millions of entities and relationships.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Science',
    link: 'https://www.wikidata.org/wiki/Wikidata:REST_API',
    sampleEndpoint: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Albert+Einstein&language=en&format=json'
  },

  // --- Geocoding & Places ---
  {
    name: 'REST Countries',
    description: 'Get information about country flags, capitals, population, languages, and currencies.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Geocoding',
    link: 'https://restcountries.com',
    sampleEndpoint: 'https://restcountries.com/v3.1/name/japan'
  },
  {
    name: 'OpenStreetMap Nominatim',
    description: 'Free reverse geocoding and address search powered by OpenStreetMap.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Geocoding',
    link: 'https://nominatim.org',
    sampleEndpoint: 'https://nominatim.openstreetmap.org/search?q=Paris&format=json'
  },
  {
    name: 'Zippopotam.us',
    description: 'Postal code and zipcode information for 60+ countries.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Geocoding',
    link: 'https://www.zippopotam.us',
    sampleEndpoint: 'https://api.zippopotam.us/us/90210'
  },

  // --- Entertainment & Gaming ---
  {
    name: 'PokéAPI',
    description: 'Comprehensive RESTful API for Pokémon data, moves, abilities, types, and stats.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Games',
    link: 'https://pokeapi.co',
    sampleEndpoint: 'https://pokeapi.co/api/v2/pokemon/pikachu'
  },
  {
    name: 'Open Trivia Database',
    description: 'Free database of thousands of verified trivia quiz questions across multiple categories.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Games',
    link: 'https://opentdb.com/api_config.php',
    sampleEndpoint: 'https://opentdb.com/api.php?amount=10'
  },
  {
    name: 'Jikan (Unofficial MyAnimeList)',
    description: 'Open-source anime and manga REST API serving complete MyAnimeList database records.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Anime',
    link: 'https://jikan.moe',
    sampleEndpoint: 'https://api.jikan.moe/v4/anime?q=naruto'
  },

  // --- News & Social ---
  {
    name: 'HackerNews Firebase API',
    description: 'Official real-time streaming and REST API for stories, comments, and top scores on HackerNews.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'News',
    link: 'https://github.com/HackerNews/API',
    sampleEndpoint: 'https://hacker-news.firebaseio.com/v0/topstories.json'
  },
  {
    name: 'Reddit JSON API',
    description: 'Append .json to any public subreddit or post URL to receive complete raw data.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'News',
    link: 'https://www.reddit.com/dev/api/',
    sampleEndpoint: 'https://www.reddit.com/r/programming/top.json?limit=5'
  },

  // --- Books & Literature ---
  {
    name: 'Open Library',
    description: 'Over 20 million catalog records of books, covers, subjects, and authors from the Internet Archive.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Books',
    link: 'https://openlibrary.org/developers/api',
    sampleEndpoint: 'https://openlibrary.org/search.json?q=the+lord+of+the+rings'
  },
  {
    name: 'Gutendex',
    description: 'Web API for Project Gutenberg public-domain ebooks metadata and direct text downloads.',
    auth: 'No',
    https: true,
    cors: 'yes',
    category: 'Books',
    link: 'https://gutendex.com',
    sampleEndpoint: 'https://gutendex.com/books/?search=frankentstein'
  }
];

function getAllApis() {
  return PUBLIC_APIS_DATABASE;
}

function getCategories() {
  const categories = new Set();
  PUBLIC_APIS_DATABASE.forEach(api => categories.add(api.category));
  return Array.from(categories).sort();
}

function searchApis(query = '', category = '') {
  const q = query.trim().toLowerCase();
  const cat = category.trim().toLowerCase();

  return PUBLIC_APIS_DATABASE.filter(api => {
    const matchesCat = !cat || api.category.toLowerCase() === cat;
    if (!matchesCat) return false;

    if (!q) return true;
    return api.name.toLowerCase().includes(q) ||
           api.description.toLowerCase().includes(q) ||
           api.category.toLowerCase().includes(q);
  });
}

/**
 * Searches the public-apis index when a user asks about available APIs
 */
async function searchPublicApisForQuery(query) {
  const q = query.toLowerCase();
  const isAskingForApi = /\b(api|apis|public api|public-api|free api|endpoint|endpoints|rest api)\b/.test(q);
  if (!isAskingForApi) return null;

  // Extract category or keyword
  let matched = [];
  const words = q.split(/\s+/).filter(w => w.length > 2 && !['what', 'which', 'give', 'show', 'tell', 'find', 'free', 'good', 'best', 'public', 'apis', 'api', 'for', 'the', 'with', 'any'].includes(w));

  for (const word of words) {
    const res = searchApis(word);
    if (res.length > 0) {
      matched = res;
      break;
    }
  }

  if (matched.length === 0) {
    matched = PUBLIC_APIS_DATABASE.slice(0, 5);
  }

  const listText = matched.slice(0, 4).map(a => 
    `* **${a.name}** (${a.category}) — ${a.description}\n  - Auth: ${a.auth} | HTTPS: ${a.https ? 'Yes' : 'No'} | Link: ${a.link}`
  ).join('\n\n');

  return {
    source: 'public-apis Directory',
    url: 'https://github.com/public-apis/public-apis',
    title: 'Curated Public APIs Recommendation',
    extract: `Relevant free APIs from public-apis index:\n\n${listText}`,
    liveData: {
      recommendations: matched.slice(0, 5)
    }
  };
}

module.exports = {
  PUBLIC_APIS_DATABASE,
  getAllApis,
  getCategories,
  searchApis,
  searchPublicApisForQuery
};
