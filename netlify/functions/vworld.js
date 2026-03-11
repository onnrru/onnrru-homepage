const VWORLD_API_BASE = 'https://api.vworld.kr';
const FALLBACK_KEY = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';

function withCors(headers = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        ...headers
    };
}

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: withCors(), body: '' };
    }

    try {
        const apiKey = process.env.VWORLD_API_KEY || FALLBACK_KEY;
        const vworldDomain = process.env.VWORLD_DOMAIN || 'onnrru.com';

        // Clean path to get the relative upstream part
        let relPath = event.path
            .replace('/.netlify/functions/vworld', '')
            .replace('/api/vworld', '')
            .replace('/req/wmts/1.0.0/SECRET', '')
            .replace('/req/wmts/1.0.0/' + apiKey, '');

        if (relPath.startsWith('/')) relPath = relPath.slice(1);

        const q = event.queryStringParameters || {};
        let upstreamUrl = '';

        // 1. WMTS Handling
        if (relPath.toLowerCase().includes('wmts') || 
            relPath.split('/').length >= 3 && /\d+\/\d+\/\d+/.test(relPath)) {
            
            let wmtsPath = relPath;
            if (wmtsPath.includes('wmts/')) {
                wmtsPath = wmtsPath.split('wmts/').pop();
            }
            // Remove leading version/key if present
            if (wmtsPath.startsWith('1.0.0/')) {
                wmtsPath = wmtsPath.split('/').slice(2).join('/');
            }
            
            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;
        } 
        // 2. WMS Handling
        else if (relPath.toLowerCase().includes('wms')) {
            const params = new URLSearchParams({ ...q, key: apiKey, domain: vworldDomain });
            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${params.toString()}`;
        }
        // 3. Data/Search/Etc Handling
        else {
            const params = new URLSearchParams({ ...q, key: apiKey, domain: vworldDomain });
            const finalPath = relPath.startsWith('req/') ? relPath : `req/${relPath}`;
            upstreamUrl = `${VWORLD_API_BASE}/${finalPath}?${params.toString()}`;
        }

        const res = await fetch(upstreamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': `https://${vworldDomain}/`
            }
        });

        const arrayBuffer = await res.arrayBuffer();
        const bodyBuffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'application/octet-stream';

        if (contentType.startsWith('image/') || contentType.includes('application/octet-stream')) {
            return {
                statusCode: res.status,
                headers: withCors({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' }),
                body: bodyBuffer.toString('base64'),
                isBase64Encoded: true
            };
        }

        return {
            statusCode: res.status,
            headers: withCors({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=60' }),
            body: bodyBuffer.toString('utf-8')
        };
    } catch (error) {
        console.error('VWorld Proxy Error:', error);
        return {
            statusCode: 500,
            headers: withCors({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
                error: 'VWorld proxy failed', 
                message: error.message,
                stack: error.stack,
                env_check: {
                    has_key: !!process.env.VWORLD_API_KEY,
                    node_version: process.version
                }
            })
        };
    }
}
