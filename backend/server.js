const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://onnrru.com',
  'https://www.onnrru.com',
  'https://onnrru.netlify.app'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, true);
  }
}));

app.use(express.json());

// ------------------------------
// EUM
// ------------------------------
const EUM_API_BASE = 'https://api.eum.go.kr/web/Rest/OP';

async function fetchFromEum(endpoint, params, res) {
  try {
    const apiKey = process.env.EUM_API_KEY;
    const apiId = process.env.EUM_API_ID;

    if (!apiKey || !apiId) {
      return res.status(500).json({ error: 'EUM_API_ID or EUM_API_KEY missing' });
    }

    const response = await axios.get(`${EUM_API_BASE}/${endpoint}`, {
      params: {
        ...params,
        key: apiKey,
        id: apiId
      },
      responseType: 'text',
      timeout: 15000,
      validateStatus: () => true
    });

    res.status(response.status);
    res.set('Content-Type', response.headers['content-type'] || 'application/xml; charset=utf-8');
    return res.send(response.data);
  } catch (error) {
    console.error(`EUM Proxy Error (${endpoint}):`, error.message);
    return res.status(500).send('Internal Server Error');
  }
}

app.get('/api/eum/zone', (req, res) => {
  const { areaCd, uname } = req.query;
  fetchFromEum('searchZone', { areaCd, type: 'S', uname }, res);
});

app.get('/api/eum/law', (req, res) => {
  const { areaCd, ucodeList } = req.query;
  fetchFromEum('luLawInfo', { areaCd, ucodeList }, res);
});

app.get('/api/eum/landuse', (req, res) => {
  const { areaCd, landUseNm, lunCdc } = req.query;
  fetchFromEum('arLandUseInfo', { areaCd, landUseNm, lunCdc }, res);
});

app.get('/api/eum/map', (req, res) => {
  const { areaCd, startDt, endDt, PageNo } = req.query;
  fetchFromEum('arMapList', { areaCd, startDt, endDt, PageNo }, res);
});

app.get('/api/eum/guide', (req, res) => {
  fetchFromEum('ebGuideBookList', {}, res);
});

app.get('/api/eum/devlist', async (req, res) => {
  try {
    const apiKey = process.env.EUM_API_KEY;
    const apiId = process.env.EUM_API_ID;
    const { PageNo, areaCd, prmisnDe } = req.query;

    const response = await axios.get(`${EUM_API_BASE}/isDevList`, {
      params: {
        key: apiKey,
        id: apiId,
        PageNo,
        areaCd,
        prmisnDe
      },
      responseType: 'json',
      timeout: 15000,
      validateStatus: () => true
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('EUM devlist Proxy Error:', error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// ------------------------------
// VWORLD
// ------------------------------
const VWORLD_API_BASE = 'https://api.vworld.kr';

app.get('/api/vworld/*', async (req, res) => {
  try {
    const apiKey = process.env.VWORLD_API_KEY;
    const vworldDomain = process.env.VWORLD_DOMAIN || 'onnrru.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'VWORLD_API_KEY missing' });
    }

    const subPath = req.path.replace('/api/vworld', '') || '';
    const q = req.query || {};

    let upstreamUrl = '';

    // 1) WMTS
    if (subPath.startsWith('/wmts/') || subPath.startsWith('/req/wmts/1.0.0/')) {
      let wmtsPath = subPath;

      if (wmtsPath.startsWith('/req/wmts/1.0.0/')) {
        wmtsPath = wmtsPath.replace('/req/wmts/1.0.0/', '');

        // 첫 segment(SECRET 또는 잘못 박힌 키) 제거
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

      res.status(response.status);
      res.set('Content-Type', response.headers['content-type'] || 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(response.data);
    }

    // 2) WMS
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

      res.status(response.status);
      res.set('Content-Type', response.headers['content-type'] || 'image/png');
      res.set('Cache-Control', 'public, max-age=300');
      return res.send(response.data);
    }

    // 3) req/* or ned/*
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
      res.set('Content-Type', response.headers['content-type'] || 'application/json; charset=utf-8');
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

// ------------------------------
// MOLIT
// ------------------------------
const MOLIT_API_BASE = 'https://apis.data.go.kr';

app.get('/api/molit/*', async (req, res) => {
  try {
    const apiKey = process.env.MOLIT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'MOLIT_API_KEY missing' });
    }

    const relPath = req.path.replace('/api/molit', '') || '';

    const response = await axios.get(`${MOLIT_API_BASE}${relPath}`, {
      params: {
        ...req.query,
        serviceKey: apiKey
      },
      responseType: 'text',
      timeout: 15000,
      validateStatus: () => true
    });

    res.status(response.status);
    res.set('Content-Type', response.headers['content-type'] || 'application/xml; charset=utf-8');
    return res.send(response.data);
  } catch (error) {
    console.error('MOLIT Proxy Error:', error.message);
    return res.status(500).json({
      error: 'MOLIT proxy failed',
      message: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('Onnrru Backend Proxy is Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
