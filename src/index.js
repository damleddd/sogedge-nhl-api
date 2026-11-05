
const NHL = 'https://api-web.nhle.com/v1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Vary': 'Origin'
};

const allowed = [
  /^\/schedule\/\d{4}-\d{2}-\d{2}\/?$/,
  /^\/roster\/[A-Z]{2,3}\/current\/?$/,
  /^\/player\/\d+\/game-log\/\d{8}\/2\/?$/,
  /^\/player\/\d+\/landing\/?$/,
  /^\/standings\/now\/?$/
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS
      });
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        app: 'SOG EDGE NHL API',
        version: 'proxy-v2'
      });
    }

    let path = url.pathname;

    if (path === '/api/schedule') {
      const date = url.searchParams.get('date') || '';
      path = '/schedule/' + date;
    } else if (path.startsWith('/v1/')) {
      path = path.slice(3);
    } else {
      return json({ error: 'Unknown endpoint' }, 404);
    }

    if (!allowed.some(re => re.test(path))) {
      return json({ error: 'Unsupported NHL endpoint' }, 404);
    }

    try {
      const upstream = await fetch(NHL + path, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SOG-EDGE/1.0'
        },
        cf: {
          cacheTtl: 60,
          cacheEverything: true
        }
      });

      const body = await upstream.text();

      return new Response(body, {
        status: upstream.status,
        headers: {
          ...CORS,
          'Content-Type': upstream.headers.get('Content-Type') ||
            'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60'
        }
      });
    } catch (error) {
      return json({
        error: 'Unable to reach NHL data service: ' +
          String(error.message || error)
      }, 502);
    }
  }
};
