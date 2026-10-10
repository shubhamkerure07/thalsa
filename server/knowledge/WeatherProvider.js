const { fetchJson } = require('./httpUtil');

// WMO Weather interpretation codes (http://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

/**
 * Searches for real-time weather using Open-Meteo Public API
 * No authentication required, 100% free and open.
 */
async function searchWeather(query) {
  try {
    // Extract city name: prefer string after "in", "at", "for", "of"
    let city = '';
    const match = query.match(/\b(?:in|at|for|of)\s+([a-zA-Z\s]+)/i);
    if (match && match[1]) {
      city = match[1].replace(/[?.,!]/g, '').trim();
    } else {
      city = query
        .replace(/\b(what is|what's|how is|check|tell me|the|weather|temperature|forecast|current|today|tomorrow)\b/gi, '')
        .replace(/[?.,!]/g, '')
        .trim();
    }

    if (!city || city.length < 2) return null;

    // Preset coordinates for instant response
    const PRESET_CITIES = {
      'tokyo': { latitude: 35.6895, longitude: 139.6917, name: 'Tokyo', country: 'Japan' },
      'london': { latitude: 51.5074, longitude: -0.1278, name: 'London', country: 'United Kingdom' },
      'new york': { latitude: 40.7128, longitude: -74.0060, name: 'New York', country: 'United States' },
      'paris': { latitude: 48.8566, longitude: 2.3522, name: 'Paris', country: 'France' },
      'delhi': { latitude: 28.6139, longitude: 77.2090, name: 'Delhi', country: 'India' },
      'new delhi': { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi', country: 'India' },
      'mumbai': { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai', country: 'India' },
      'bengaluru': { latitude: 12.9716, longitude: 77.5946, name: 'Bengaluru', country: 'India' },
      'bangalore': { latitude: 12.9716, longitude: 77.5946, name: 'Bangalore', country: 'India' },
      'berlin': { latitude: 52.5200, longitude: 13.4050, name: 'Berlin', country: 'Germany' },
      'sydney': { latitude: -33.8688, longitude: 151.2093, name: 'Sydney', country: 'Australia' }
    };

    let loc = PRESET_CITIES[city.toLowerCase()];

    // 1. Geocoding lookup if not preset
    if (!loc) {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoData = await fetchJson(geoUrl, { timeout: 4000 });
        if (geoData.results && geoData.results.length > 0) {
          loc = geoData.results[0];
        }
      } catch (_) {}
    }

    if (!loc) return null;

    const { latitude, longitude, name, country, admin1, timezone } = loc;

    // 2. Real-time forecast lookup
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const weatherData = await fetchJson(forecastUrl, { timeout: 6000 });

    if (!weatherData.current) return null;

    const curr = weatherData.current;
    const condition = WMO_CODES[curr.weather_code] || 'Cloudy';
    const tempC = Math.round(curr.temperature_2m);
    const feelsLikeC = Math.round(curr.apparent_temperature);
    const humidity = curr.relative_humidity_2m;
    const windSpeed = curr.wind_speed_10m;

    const locationName = [name, admin1, country].filter(Boolean).join(', ');

    return {
      source: 'Open-Meteo Public API',
      url: `https://open-meteo.com/en/docs#latitude=${latitude}&longitude=${longitude}`,
      title: `Live Weather: ${locationName}`,
      extract: `Current weather in ${locationName}: ${condition}, ${tempC}°C (feels like ${feelsLikeC}°C). Relative humidity: ${humidity}%, wind speed: ${windSpeed} km/h. Local timezone: ${timezone || 'UTC'}.`,
      liveData: {
        location: locationName,
        temperature: `${tempC}°C`,
        feelsLike: `${feelsLikeC}°C`,
        condition,
        humidity: `${humidity}%`,
        windSpeed: `${windSpeed} km/h`
      }
    };
  } catch (err) {
    console.warn('[WeatherProvider] Failed to fetch weather:', err.message);
    return null;
  }
}

module.exports = { searchWeather };
