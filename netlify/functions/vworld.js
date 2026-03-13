const VWORLD_API_BASE = 'https://api.vworld.kr';
const FALLBACK_KEY = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';

function withCors(headers = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Accept',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        ...headers
    };
}

export async function handler(event) {
    const startTime = Date.now();
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: withCors(), body: '' };
    }

    const apiKey = (process.env.VWORLD_API_KEY || FALLBACK_KEY).trim();
    const vworldDomain = (process.env.VWORLD_DOMAIN || 'onnrru.com').trim();
    
    // Extract subPath more robustly
    let subPath = event.path
        .replace('/.netlify/functions/vworld', '')
        .replace('/api/vworld', '') || '/';
    
    // Normalize subPath: ensure it starts with /
    if (!subPath.startsWith('/')) subPath = '/' + subPath;

    const q = event.queryStringParameters || {};
    let upstreamUrl = '';
    let isBinary = false;

    try {
        // 1) WMTS Handler - Handle both /wmts/ and /req/wmts/
        if (subPath.includes('wmts')) {
            isBinary = true;
            // Extract the meaningful segments (layer/z/y/x)
            // Example: /wmts/Base/16/123/456.png -> Base/16/123/456.png
            // Example: /req/wmts/Base/16/123/456.png -> Base/16/123/456.png
            const segments = subPath.split('/').filter(s => s && s !== 'wmts' && s !== 'req' && s !== '1.0.0' && s !== apiKey && s !== 'SECRET');
            const wmtsPath = segments.join('/');
            
            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;
        } 
        // 2) WMS Handler
        else if (subPath === '/wms' || subPath === '/req/wms') {
            isBinary = true;
            const params = new URLSearchParams({ ...q, key: apiKey, domain: vworldDomain });
            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${params.toString()}`;
        }
        // 3) General req/ned Handler
        else if (subPath.startsWith('/req/') || subPath.startsWith('/ned/')) {
            const params = new URLSearchParams({ ...q, key: apiKey, domain: vworldDomain });
            upstreamUrl = `${VWORLD_API_BASE}${subPath}?${params.toString()}`;
        }
        // 4) Fallback
        else {
            return {
                statusCode: 404,
                headers: withCors({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ error: 'Unsupported VWorld path', path: subPath, originalPath: event.path })
            };
        }

        const res = await fetch(upstreamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `https://${vworldDomain}/`
            },
            signal: AbortSignal.timeout(9000) // 9 second timeout for VWorld
        });

        const contentType = res.headers.get('content-type') || (isBinary ? 'image/png' : 'application/json; charset=utf-8');
        const arrayBuffer = await res.arrayBuffer();
        const bodyBuffer = Buffer.from(arrayBuffer);

        if (!res.ok) {
            console.error(`[VWorld Proxy] Upstream error ${res.status} for ${upstreamUrl}`);
            return {
                statusCode: res.status,
                headers: withCors({ 'Content-Type': contentType }),
                body: isBinary ? bodyBuffer.toString('base64') : bodyBuffer.toString('utf-8'),
                isBase64Encoded: isBinary
            };
        }

        return {
            statusCode: res.status,
            headers: withCors({
                'Content-Type': contentType,
                'Cache-Control': isBinary ? 'public, max-age=86400' : 'public, max-age=60'
            }),
            body: isBinary ? bodyBuffer.toString('base64') : bodyBuffer.toString('utf-8'),
            isBase64Encoded: isBinary
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[VWorld Proxy Exception] ${error.name}: ${error.message} (Duration: ${duration}ms)`);
        
        return {
            statusCode: error.name === 'TimeoutError' ? 504 : 500,
            headers: withCors({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
                error: 'VWorld proxy failed', 
                message: error.message,
                name: error.name,
                duration,
                context: {
                    path: subPath,
                    originalPath: event.path,
                    upstream: upstreamUrl?.split('?')[0], // Don't log full key
                    env: {
                        has_key: !!process.env.VWORLD_API_KEY,
                        vworld_domain: vworldDomain
                    }
                }
            })
        };
    }
}
