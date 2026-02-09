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

app.get('/', (req, res) => {
    res.send('Onnrru Backend Proxy is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
