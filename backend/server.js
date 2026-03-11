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
// EUM Proxy (Catch-all)
// ------------------------------
const EUM_API_BASE = 'https://api.eum.go.kr';

app.all('/api/eum/*', async (req, res) => {
  try {
    const apiKey = (process.env.EUM_API_KEY || '').trim();
    const apiId = (process.env.EUM_API_ID || '').trim();
    
    if (!apiKey || !apiId) {
      return res.status(500).json({ error: 'EUM_API configuration missing' });
    }

    const relPath = req.path.replace('/api/eum', '') || '';
    const upstreamUrl = `${EUM_API_BASE}${relPath}`;

    console.log(`[EUM Proxy] ${req.method} ${upstreamUrl}`);

    const response = await axios({
      method: req.method,
      url: upstreamUrl,
      params: {
        ...req.query,
        key: apiKey,
        id: apiId
      },
      data: req.body,
      timeout: 15000,
      validateStatus: () => true
    });

    res.status(response.status);
    res.set('Content-Type', response.headers['content-type'] || 'application/xml; charset=utf-8');
    return res.send(response.data);
  } catch (error) {
    console.error('[EUM Proxy Error]', error.message);
    return res.status(500).json({ error: 'EUM proxy failed', message: error.message });
  }
});

// ------------------------------
// VWORLD Proxy (Catch-all)
// ------------------------------
const VWORLD_API_BASE = 'https://api.vworld.kr';

app.all('/api/vworld/*', async (req, res) => {
  try {
    const apiKey = (process.env.VWORLD_API_KEY || '').trim();
    const domain = (process.env.VWORLD_DOMAIN || 'onnrru.com').trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'VWORLD_API_KEY missing' });
    }

    let relPath = req.path.replace('/api/vworld', '') || '';
    let upstreamUrl = '';

    // Specialized Logic for WMTS (handling /map/wmts, /wmts, etc.)
    if (relPath.includes('wmts') || /\d+\/\d+\/\d+/.test(relPath)) {
      const segments = relPath.split('/');
      // Extract tile coords: layer/z/x/y (last 4 segments)
      const wmtsSegments = segments.filter(s => s && s !== 'SECRET' && s !== apiKey);
      const wmtsPath = wmtsSegments.slice(-4).join('/');
      
      upstreamUrl = `${VWORLD_API_BASE}/req/wmts/1.0.0/${apiKey}/${wmtsPath}`;
    } else {
      // Standard WMS or Data requests
      const params = new URLSearchParams(req.query);
      if (!params.has('key')) params.set('key', apiKey);
      if (!params.has('domain')) params.set('domain', domain);
      
      upstreamUrl = `${VWORLD_API_BASE}${relPath}?${params.toString()}`;
    }

    console.log(`[VWorld Proxy] ${req.method} ${upstreamUrl}`);

    const isBinary = relPath.includes('wmts') || relPath.includes('wms') || /\.(png|jpe?g|gif)$/i.test(relPath);

    const response = await axios({
      method: req.method,
      url: upstreamUrl,
      responseType: isBinary ? 'arraybuffer' : 'text',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': `https://${domain}/`,
        'Origin': `https://${domain}`
      },
      validateStatus: () => true
    });

    res.status(response.status);
    res.set('Content-Type', response.headers['content-type'] || (isBinary ? 'image/png' : 'application/json; charset=utf-8'));
    if (isBinary) res.set('Cache-Control', 'public, max-age=86400');
    return res.send(response.data);
  } catch (error) {
    console.error('[VWorld Proxy Error]', error.message);
    return res.status(500).json({ error: 'VWorld proxy failed', message: error.message });
  }
});

// ------------------------------
// MOLIT Proxy (Catch-all)
// ------------------------------
const MOLIT_API_BASE = 'https://apis.data.go.kr';

app.all('/api/molit/*', async (req, res) => {
  try {
    const apiKey = (process.env.MOLIT_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'MOLIT_API_KEY missing' });
    }

    const relPath = req.path.replace('/api/molit', '') || '';
    const upstreamUrl = `${MOLIT_API_BASE}${relPath}`;

    console.log(`[MOLIT Proxy] ${req.method} ${upstreamUrl}`);

    const response = await axios({
      method: req.method,
      url: upstreamUrl,
      params: {
        ...req.query,
        serviceKey: apiKey
      },
      timeout: 15000,
      validateStatus: () => true
    });

    res.status(response.status);
    res.set('Content-Type', response.headers['content-type'] || 'application/xml; charset=utf-8');
    return res.send(response.data);
  } catch (error) {
    console.error('[MOLIT Proxy Error]', error.message);
    return res.status(500).json({ error: 'MOLIT proxy failed', message: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Onnrru Backend Proxy is Running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
