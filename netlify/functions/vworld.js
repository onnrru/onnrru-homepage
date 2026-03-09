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
        const apiKey = process.env.VWORLD_API_KEY;
        const vworldDomain = process.env.VWORLD_DOMAIN || 'onnrru.com';

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: withCors({ 'Content-Type': 'application/json; charset=utf-8' }),
                body: JSON.stringify({
                    error: 'VWORLD_API_KEY is missing'
                })
            };
        }

        const rawPath = event.path.replace('/.netlify/functions/vworld', '') || '';
        const q = event.queryStringParameters || {};

        let upstreamUrl = '';

        // 1) WMTS
        if (rawPath.startsWith('/wmts/') || rawPath.startsWith('/req/wmts/')) {
            let wmtsPath = rawPath;

            if (wmtsPath.startsWith('/req/wmts/1.0.0/')) {
                wmtsPath = wmtsPath.replace('/req/wmts/1.0.0/', '');

                const firstSlash = wmtsPath.indexOf('/');
                if (firstSlash > -1) {
                    wmtsPath = wmtsPath.slice(firstSlash + 1);
                }
            } else {
                wmtsPath = wmtsPath.replace('/wmts/', '');
            }

            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;
        }

        // 2) WMS
        else if (rawPath === '/wms' || rawPath === '/req/wms') {
            const query = buildQuery({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${query.toString()}`;
        }

        // 3) req/*
        else if (rawPath.startsWith('/req/')) {
            const query = buildQuery({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}${rawPath}?${query.toString()}`;
        }

        // 4) ned/*
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
                'User-Agent': 'onnrru-netlify-vworld-proxy'
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
