const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Update this with your actual frontend domain when deployed
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://onnrru.com',
    'https://www.onnrru.com',
    'https://onnrru.netlify.app' // Assuming netlify deploy might have this
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
            // Optional: Allow all during dev/testing if needed, but stricter is better
            // return callback(null, true); 
            return callback(null, true); // Temporarily allow all for easier testing
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// API Base URL
const EUM_API_BASE = 'https://api.eum.go.kr/web/Rest/OP';

// Helper to handle API requests
const fetchFromEum = async (endpoint, params, res) => {
    try {
        const apiKey = process.env.EUM_API_KEY;
        const apiId = process.env.EUM_API_ID; // Setup ID from env

        const response = await axios.get(`${EUM_API_BASE}/${endpoint}`, {
            params: {
                ...params,
                key: apiKey, // Inject key here so it's not exposed in frontend
                id: apiId    // Inject ID here
            },
            // The government API returns XML. We might want to convert to JSON or just pass XML.
            // Let's pass the raw response for now, frontend can parse XML or we can add xml2js here.
            responseType: 'text'
        });

        res.set('Content-Type', 'application/xml');
        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
};

// 1. Search Zone (지역·지구 코드 조회)
// Endpoint: /searchZone
app.get('/api/eum/zone', (req, res) => {
    // Expected params from frontend: areaCd, type, uname
    const { areaCd, type, uname } = req.query;
    fetchFromEum('searchZone', { areaCd, type: 'S', uname }, res);
});

// 2. Land Use Law Info (토지이용규제 법령정보)
// Endpoint: /luLawInfo
app.get('/api/eum/law', (req, res) => {
    const { areaCd, ucodeList } = req.query;
    fetchFromEum('luLawInfo', { areaCd, ucodeList }, res);
});

// 3. Land Use Restriction Info (토지이용규제 행위제한정보)
// Endpoint: /arLandUseInfo
app.get('/api/eum/landuse', (req, res) => {
    const { areaCd, landUseNm, lunCdc } = req.query;
    fetchFromEum('arLandUseInfo', { areaCd, landUseNm, lunCdc }, res);
});

// 4. Record Match Info (고시정보)
// Endpoint: /arMapList
app.get('/api/eum/map', (req, res) => {
    const { areaCd, startDt, endDt, PageNo } = req.query;
    fetchFromEum('arMapList', { areaCd, startDt, endDt, PageNo }, res);
});

// 5. Easy Regulation Guide (쉬운규제안내서)
// Endpoint: /ebGuideBookList
app.get('/api/eum/guide', (req, res) => {
    // No specific params required by default generally, or just key
    // Provided image shows response with list, so maybe just fetching list
    fetchFromEum('ebGuideBookList', {}, res);
});

// 6. Development Permit List (개발행위 인허가 목록)
// Endpoint: /isDevList
// Note: This API accepts JSON response format natively presumably or we request it.
// The provided image shows "Format: json".
app.get('/api/eum/devlist', async (req, res) => {
    const { PageNo, areaCd, prmisnDe } = req.query;

    // We override fetchFromEum slightly for this because it might be JSON
    try {
        const apiKey = process.env.EUM_API_KEY;
        const apiId = process.env.EUM_API_ID; // Setup ID from env

        const response = await axios.get(`${EUM_API_BASE}/isDevList`, {
            params: {
                key: apiKey,
                id: apiId, // Add ID
                PageNo,
                areaCd,
                prmisnDe
            },
            // Prefer JSON if supported, though standard 'searchZone' etc are XML. 
            // The prompt says "Exchange Standard: JSON" for this specific API.
            responseType: 'json'
        });

        res.json(response.data); // Send as JSON directly
    } catch (error) {
        console.error(`Error fetching isDevList:`, error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});

// --- VWorld API Handle ---
const VWORLD_API_BASE = 'https://api.vworld.kr';

app.get('/api/vworld/*', async (req, res) => {
    try {
        const apiKey = process.env.VWORLD_API_KEY;
        const vworldDomain = process.env.VWORLD_DOMAIN || 'onnrru.com';

        if (!apiKey) {
            return res.status(500).json({
                error: 'VWORLD_API_KEY missing'
            });
        }

        // /api/vworld 제거 후 실제 하위 경로 추출
        const subPath = req.path.replace('/api/vworld', '') || '';
        const q = req.query || {};

        let upstreamUrl = '';

        // 1) WMTS 처리
        // 지원해야 하는 호출 예:
        // /api/vworld/wmts/Satellite/17/...
        // /api/vworld/req/wmts/1.0.0/SECRET/Satellite/17/...
        // /api/vworld/req/wmts/1.0.0/{REALKEY}/Satellite/17/...
        if (subPath.startsWith('/wmts/') || subPath.startsWith('/req/wmts/1.0.0/')) {
            let wmtsPath = subPath;

            if (wmtsPath.startsWith('/req/wmts/1.0.0/')) {
                wmtsPath = wmtsPath.replace('/req/wmts/1.0.0/', '');

                // 첫 segment(기존 SECRET 또는 하드코딩된 키)를 제거
                const firstSlash = wmtsPath.indexOf('/');
                if (firstSlash === -1) {
                    return res.status(400).send('Invalid WMTS path');
                }
                wmtsPath = wmtsPath.slice(firstSlash + 1);
            } else {
                wmtsPath = wmtsPath.replace('/wmts/', '');
            }

            upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;

            const response = await axios.get(upstreamUrl, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'onnrru-server',
                    'Referer': `https://${vworldDomain}/`,
                    'Origin': `https://${vworldDomain}`
                },
                validateStatus: () => true
            });

            if (response.status >= 400) {
                res.status(response.status);
                res.set('Content-Type', response.headers['content-type'] || 'text/plain; charset=utf-8');
                return res.send(response.data);
            }

            res.set('Content-Type', response.headers['content-type'] || 'image/png');
            res.set('Cache-Control', 'public, max-age=86400');
            return res.send(response.data);
        }

        // 2) WMS 처리
        if (subPath === '/wms' || subPath === '/req/wms') {
            const params = new URLSearchParams({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}/req/wms?${params.toString()}`;

            const response = await axios.get(upstreamUrl, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'onnrru-server',
                    'Referer': `https://${vworldDomain}/`,
                    'Origin': `https://${vworldDomain}`
                },
                validateStatus: () => true
            });

            if (response.status >= 400) {
                res.status(response.status);
                res.set('Content-Type', response.headers['content-type'] || 'text/plain; charset=utf-8');
                return res.send(response.data);
            }

            res.set('Content-Type', response.headers['content-type'] || 'image/png');
            res.set('Cache-Control', 'public, max-age=300');
            return res.send(response.data);
        }

        // 3) 일반 req/* 및 ned/* 처리
        if (subPath.startsWith('/req/') || subPath.startsWith('/ned/')) {
            const params = new URLSearchParams({
                ...q,
                key: apiKey,
                domain: vworldDomain
            });

            upstreamUrl = `${VWORLD_API_BASE}${subPath}?${params.toString()}`;

            const response = await axios.get(upstreamUrl, {
                responseType: 'text',
                timeout: 15000,
                headers: {
                    'User-Agent': 'onnrru-server',
                    'Referer': `https://${vworldDomain}/`,
                    'Origin': `https://${vworldDomain}`
                },
                validateStatus: () => true
            });

            res.status(response.status);
            res.set(
                'Content-Type',
                response.headers['content-type'] || 'application/json; charset=utf-8'
            );
            return res.send(response.data);
        }

        return res.status(404).json({
            error: 'Unsupported VWorld path',
            path: subPath
        });
    } catch (error) {
        console.error('VWorld Proxy Error:', error.response?.status, error.message);

        if (error.response) {
            res.status(error.response.status);
            res.set(
                'Content-Type',
                error.response.headers?.['content-type'] || 'text/plain; charset=utf-8'
            );
            return res.send(error.response.data);
        }

        return res.status(500).json({
            error: 'VWorld proxy failed',
            message: error.message
        });
    }
});

// --- MOLIT API Handle ---
const MOLIT_API_BASE = 'https://apis.data.go.kr';
app.get('/api/molit/*', async (req, res) => {
    try {
        const apiKey = process.env.MOLIT_API_KEY;
        if (!apiKey) throw new Error('MOLIT_API_KEY missing');

        const relPath = req.path.replace('/api/molit', '') || '';
        const upstreamUrl = `${MOLIT_API_BASE}${relPath}`;

        const response = await axios.get(upstreamUrl, {
            params: {
                ...req.query,
                serviceKey: apiKey
            },
            responseType: 'text'
        });

        res.set('Content-Type', response.headers['content-type'] || 'application/xml');
        res.send(response.data);
    } catch (error) {
        console.error('MOLIT Proxy Error:', error.message);
        res.status(500).json({ error: 'MOLIT proxy failed', message: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Onnrru Backend Proxy is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
