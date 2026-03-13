// v1.0.7 - Using native fetch (Node 20+)
const VWORLD_API_BASE = 'https://api.vworld.kr';
const FALLBACK_KEY = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';

function withCors(headers = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        ...headers
    };
}

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: withCors(), body: '' };
    }

    const apiKey = (process.env.VWORLD_API_KEY || FALLBACK_KEY).trim();
    const domain = (process.env.VWORLD_DOMAIN || 'onnrru.com').trim();

    // 1. Path Extraction
    let subPath = event.path
        .replace('/.netlify/functions/vworld', '')
        .replace('/api/vworld', '') || '/';
    
    if (!subPath.startsWith('/')) subPath = '/' + subPath;

    let upstreamUrl = '';
    const isBinary = subPath.includes('wmts') || subPath.includes('wms') || /\.(png|jpe?g|gif)$/i.test(subPath);

    try {
        if (subPath.includes('wmts')) {
            const wmtsPart = subPath.includes('/wmts/') ? subPath.split('/wmts/').pop() : subPath.replace(/^\//, '');
            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPart}`;
        } else if (subPath.startsWith('/req/') || subPath.startsWith('/ned/')) {
            const params = new URLSearchParams(event.queryStringParameters || {});
            params.set('key', apiKey);
            params.set('domain', domain);
            upstreamUrl = `${VWORLD_API_BASE}${subPath}?${params.toString()}`;
        } else if (subPath === '/wms' || subPath === '/req/wms') {
            const params = new URLSearchParams(event.queryStringParameters || {});
            params.set('key', apiKey);
            params.set('domain', domain);
            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${params.toString()}`;
        } else {
            return {
                statusCode: 404,
                headers: withCors({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ error: 'Unsupported path', subPath, v: '1.0.7' })
            };
        }

        const res = await fetch(upstreamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': `https://${domain}/`,
                'Origin': `https://${domain}`
            }
        });

        const contentType = res.headers.get('content-type') || (isBinary ? 'image/png' : 'application/json; charset=utf-8');
        
        if (isBinary) {
            const buffer = await res.arrayBuffer();
            return {
                statusCode: res.status,
                headers: withCors({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                    'X-Proxy-Version': '1.0.7'
                }),
                body: Buffer.from(buffer).toString('base64'),
                isBase64Encoded: true
            };
        } else {
            const text = await res.text();
            return {
                statusCode: res.status,
                headers: withCors({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=60',
                    'X-Proxy-Version': '1.0.7'
                }),
                body: text
            };
        }

    } catch (error) {
        console.error('[VWorld Proxy Error]:', error.message);
        return {
            statusCode: 500,
            headers: withCors({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                error: 'VWorld proxy failed',
                message: error.message,
                v: '1.0.7',
                path: subPath
            })
        };
    }
}
