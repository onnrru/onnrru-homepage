// molit.js v1.0.7 - Using native fetch
const MOLIT_API_BASE = 'https://apis.data.go.kr';

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
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        ...headers
    };
}

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: withCors(), body: '' };
    }

    try {
        const apiKey = (process.env.MOLIT_API_KEY || '').trim();
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: withCors({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ error: 'MOLIT_API_KEY missing', v: '1.0.7' })
            };
        }

        const rawPath = event.path
            .replace('/.netlify/functions/molit', '')
            .replace('/api/molit', '') || '/';
        
        const query = buildQuery({
            ...event.queryStringParameters,
            serviceKey: apiKey
        });

        const upstreamUrl = `${MOLIT_API_BASE}${rawPath}?${query.toString()}`;
        
        const res = await fetch(upstreamUrl);
        const text = await res.text();
        const contentType = res.headers.get('content-type') || 'application/xml; charset=utf-8';

        return {
            statusCode: res.status,
            headers: withCors({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=60',
                'X-Proxy-Version': '1.0.7'
            }),
            body: text
        };
    } catch (error) {
        console.error('[Molit Proxy Error]:', error.message);
        return {
            statusCode: 500,
            headers: withCors({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                error: 'Molit proxy failed',
                message: error.message,
                v: '1.0.7'
            })
        };
    }
}
