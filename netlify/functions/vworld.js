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

        // Extract subPath
        const subPath = event.path
            .replace('/.netlify/functions/vworld', '')
            .replace('/api/vworld', '') || '';
        const q = event.queryStringParameters || {};

        let upstreamUrl = '';
        let isBinary = false;

        // 1) WMTS Handler
        if (subPath.startsWith('/wmts/') || subPath.startsWith('/req/wmts/1.0.0/')) {
            let wmtsPath = subPath;
            isBinary = true;

            if (wmtsPath.startsWith('/req/wmts/1.0.0/')) {
                wmtsPath = wmtsPath.replace('/req/wmts/1.0.0/', '');
                const firstSlash = wmtsPath.indexOf('/');
                if (firstSlash !== -1) {
                    wmtsPath = wmtsPath.slice(firstSlash + 1);
                }
            } else {
                wmtsPath = wmtsPath.replace('/wmts/', '');
            }

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
        else {
            return {
                statusCode: 404,
                headers: withCors({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ error: 'Unsupported VWorld path', path: subPath })
            };
        }

        const res = await fetch(upstreamUrl, {
            headers: {
                'User-Agent': 'onnrru-netlify',
                'Referer': `https://${vworldDomain}/`
            }
        });

        const arrayBuffer = await res.arrayBuffer();
        const bodyBuffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || (isBinary ? 'image/png' : 'application/json');

        if (!res.ok) {
            return {
                statusCode: res.status,
                headers: withCors({ 'Content-Type': contentType }),
                body: isBinary ? bodyBuffer.toString('base64') : bodyBuffer.toString('utf-8'),
                isBase64Encoded: isBinary
            };
        }

        if (isBinary) {
            return {
                statusCode: res.status,
                headers: withCors({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400'
                }),
                body: bodyBuffer.toString('base64'),
                isBase64Encoded: true
            };
        } else {
            return {
                statusCode: res.status,
                headers: withCors({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=60'
                }),
                body: bodyBuffer.toString('utf-8')
            };
        }
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
