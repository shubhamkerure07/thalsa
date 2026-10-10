const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { URL } = require('url');

/**
 * Resilient JSON fetcher supporting gzip/deflate, custom User-Agent, and strict timeouts
 */
function fetchJson(targetUrl, options = {}) {
  const timeoutMs = options.timeout || 7000;

  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LUMIQ-StudyAssistant/1.0 (contact@lumiq.app)',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate',
          ...(options.headers || {})
        }
      };

      const req = protocol.request(reqOptions, (res) => {
        // Handle HTTP redirects (301, 302, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          return fetchJson(redirectUrl, options).then(resolve).catch(reject);
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage || ''} for ${targetUrl}`));
        }

        let stream = res;
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip());
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate());
        }

        let body = '';
        stream.setEncoding('utf8');
        stream.on('data', chunk => { body += chunk; });
        stream.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (err) {
            reject(new Error(`Failed to parse JSON response from ${targetUrl}: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms for ${targetUrl}`));
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { fetchJson };
