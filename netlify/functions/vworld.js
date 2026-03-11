const VWORLD_API_BASE = 'https://api.vworld.kr';

function buildQuery(params = {}) {
    const qs = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            qs.append(key, String(value));
        }
    });

    return qs;
}

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
        return {
            statusCode: 200,
            headers: withCors(),
            body: ''
        };
    }

    try {
        const apiKey = process.env.VWORLD_API_KEY || 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';
        const vworldDomain = process.env.VWORLD_DOMAIN || 'onnrru.com';

        const rawPath = event.path
            .replace('/.netlify/functions/vworld', '')
            .replace('/api/vworld', '') || '';
        const q = event.queryStringParameters || {};

        let upstreamUrl = '';

        // /wmts/Base/...
        // /req/wmts/1.0.0/SECRET/Base/... 형태도 보정
        if (rawPath.includes('wmts')) {
            let wmtsPath = rawPath;

            // Handle cases like /req/wmts/1.0.0/SECRET/Base/17/...
            // or /wmts/Base/17/...
            if (wmtsPath.includes('/wmts/')) {
                const parts = wmtsPath.split('/wmts/');
                wmtsPath = parts[parts.length - 1]; // Take everything after the last /wmts/
            }

            // If it still has a key-like segment at the start (e.g. 1.0.0/SECRET/Base/...)
            if (wmtsPath.startsWith('1.0.0/')) {
                const segments = wmtsPath.split('/');
                // segments[0] = '1.0.0', segments[1] = '{key}', segments[2] = '{Layer}'
                wmtsPath = segments.slice(2).join('/');
            }

            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;
        }

        else if (rawPath === '/wms' || rawPath === '/req/wms') {
            const query = buildQuery({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${query.toString()}`;
        }

        else if (rawPath.startsWith('/req/')) {
            const query = buildQuery({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}${rawPath}?${query.toString()}`;
        }

        else if (rawPath.startsWith('/ned/')) {
            const query = buildQuery({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}${rawPath}?${query.toString()}`;
        }

        else {
            return {
                statusCode: 404,
                headers: withCors({ 'Content-Type': 'application/json; charset=utf-8' }),
                body: JSON.stringify({
                    error: 'Unsupported VWorld path',
                    path: rawPath
                })
            };
        }

        const res = await fetch(upstreamUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': `https://${vworldDomain}/`
            }
        });

        const arrayBuffer = await res.arrayBuffer();
        const bodyBuffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'application/octet-stream';

        if (
            contentType.startsWith('image/') ||
            contentType.includes('application/octet-stream')
        ) {
            return {
                statusCode: res.status,
                headers: withCors({
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=300'
                }),
                body: bodyBuffer.toString('base64'),
                isBase64Encoded: true
            };
        }

        const text = bodyBuffer.toString('utf-8');

        return {
            statusCode: res.status,
            headers: withCors({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=60'
            }),
            body: text
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: withCors({ 'Content-Type': 'application/json; charset=utf-8' }),
            body: JSON.stringify({
                error: 'VWorld proxy failed',
                message: error.message
            })
        };
    }
}
