const { fetchJson } = require('./httpUtil');

// Common cryptocurrency symbols map
const CRYPTO_MAP = {
  'btc': 'bitcoin',
  'bitcoin': 'bitcoin',
  'eth': 'ethereum',
  'ethereum': 'ethereum',
  'sol': 'solana',
  'solana': 'solana',
  'doge': 'dogecoin',
  'dogecoin': 'dogecoin',
  'ada': 'cardano',
  'cardano': 'cardano',
  'xrp': 'ripple',
  'ripple': 'ripple'
};

/**
 * Searches for real-time crypto prices or fiat exchange rates
 * Zero authentication required.
 */
async function searchFinance(query) {
  const q = query.toLowerCase();

  // 1. Check for cryptocurrency match
  const SYMBOL_TO_CODE = {
    'btc': 'BTC',
    'bitcoin': 'BTC',
    'eth': 'ETH',
    'ethereum': 'ETH',
    'sol': 'SOL',
    'solana': 'SOL',
    'doge': 'DOGE',
    'dogecoin': 'DOGE',
    'ada': 'ADA',
    'cardano': 'ADA',
    'xrp': 'XRP',
    'ripple': 'XRP'
  };

  for (const [key, code] of Object.entries(SYMBOL_TO_CODE)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(q)) {
      // Try Coinbase Public Spot API (high speed, no rate limit)
      try {
        const cbUrl = `https://api.coinbase.com/v2/prices/${code}-USD/spot`;
        const cbData = await fetchJson(cbUrl, { timeout: 3500 });
        if (cbData && cbData.data && cbData.data.amount) {
          const usdAmount = parseFloat(cbData.data.amount);
          const usdPrice = `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          // Approximate INR using current ~84 rate
          const inrPrice = `₹${Math.round(usdAmount * 84).toLocaleString()}`;
          const name = key.charAt(0).toUpperCase() + key.slice(1);

          return {
            source: 'Coinbase Public API',
            url: `https://www.coinbase.com/price/${code.toLowerCase()}`,
            title: `Live Crypto Market: ${name} (${code})`,
            extract: `Real-time ${name} (${code}) spot price: ${usdPrice} USD (approx. ${inrPrice} INR). Verified via Coinbase Public Market API.`,
            liveData: {
              asset: name,
              usd: usdPrice,
              inr: inrPrice,
              change24h: 'Live Spot'
            }
          };
        }
      } catch (_) {}

      // Fallback: CoinGecko
      try {
        const coinId = CRYPTO_MAP[key] || 'bitcoin';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,inr,eur&include_24hr_change=true`;
        const data = await fetchJson(url, { timeout: 4000 });
        const coin = data[coinId];

        if (coin) {
          const name = coinId.charAt(0).toUpperCase() + coinId.slice(1);
          const usdPrice = coin.usd ? `$${coin.usd.toLocaleString()}` : 'N/A';
          const inrPrice = coin.inr ? `₹${coin.inr.toLocaleString()}` : 'N/A';
          const change24h = coin.usd_24h_change ? `${coin.usd_24h_change > 0 ? '+' : ''}${coin.usd_24h_change.toFixed(2)}%` : '0%';

          return {
            source: 'CoinGecko Public API',
            url: `https://www.coingecko.com/en/coins/${coinId}`,
            title: `Live Crypto Market: ${name} (${key.toUpperCase()})`,
            extract: `Real-time ${name} price: ${usdPrice} USD (${inrPrice} INR). 24-hour price change: ${change24h}. Verified via CoinGecko open API.`,
            liveData: {
              asset: name,
              usd: usdPrice,
              inr: inrPrice,
              change24h
            }
          };
        }
      } catch (_) {}
    }
  }

  // 2. Check for fiat currency exchange rates
  const isCurrencyQuery = /\b(usd|inr|eur|gbp|jpy|cad|aud|exchange rate|currency|conversion|convert)\b/i.test(q);
  if (isCurrencyQuery) {
    try {
      const url = 'https://api.coinbase.com/v2/exchange-rates?currency=USD';
      const data = await fetchJson(url, { timeout: 4000 });

      if (data && data.data && data.data.rates) {
        const rates = data.data.rates;
        const inr = rates.INR ? parseFloat(rates.INR).toFixed(2) : 'N/A';
        const eur = rates.EUR ? parseFloat(rates.EUR).toFixed(2) : 'N/A';
        const gbp = rates.GBP ? parseFloat(rates.GBP).toFixed(2) : 'N/A';
        const jpy = rates.JPY ? parseFloat(rates.JPY).toFixed(2) : 'N/A';

        return {
          source: 'Coinbase Public FX API',
          url: 'https://api.coinbase.com/v2/exchange-rates?currency=USD',
          title: 'Live Foreign Exchange Rates (Base USD)',
          extract: `Current USD exchange rates: 1 USD = ₹${inr} INR | €${eur} EUR | £${gbp} GBP | ¥${jpy} JPY. Verified live via Coinbase Public Exchange API.`,
          liveData: {
            base: 'USD',
            INR: inr,
            EUR: eur,
            GBP: gbp,
            JPY: jpy
          }
        };
      }
    } catch (err) {
      console.warn('[FinanceProvider] Currency exchange fetch failed:', err.message);
    }
  }

  return null;
}

module.exports = { searchFinance };
