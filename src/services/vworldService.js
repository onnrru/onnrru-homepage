import { API_CONFIG } from '../config/api';

const vworldCache = {
  geocoding: new Map(),
  parcelData: new Map(),
  landCharacteristics: new Map(),
  ladfrl: new Map(),
};

function normalizeQuery(query) {
  return String(query || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/번지/g, '')
    .trim();
}

function coordKey(lon, lat) {
  return `${Number(lon).toFixed(6)},${Number(lat).toFixed(6)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeFetchJson(url, label = 'request', retry = 1) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();

    if (!res.ok) {
      if (retry > 0) {
        await sleep(250);
        return safeFetchJson(url, label, retry - 1);
      }
      console.warn(`${label} HTTP error:`, res.status, text.slice(0, 300));
      return null;
    }

    if (!text || !text.trim()) {
      if (retry > 0) {
        await sleep(250);
        return safeFetchJson(url, label, retry - 1);
      }
      console.warn(`${label} empty response`);
      return null;
    }

    if (text.trim().startsWith('<')) {
      if (retry > 0) {
        await sleep(250);
        return safeFetchJson(url, label, retry - 1);
      }
      console.warn(`${label} returned HTML:`, text.slice(0, 300));
      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    if (retry > 0) {
      await sleep(250);
      return safeFetchJson(url, label, retry - 1);
    }
    console.warn(`${label} failed:`, error);
    return null;
  }
}

export const VWorldService = {
  async fetchParcelByLonLat(lon, lat) {
    const cacheKey = coordKey(lon, lat);
    if (vworldCache.parcelData.has(cacheKey)) {
      return vworldCache.parcelData.get(cacheKey);
    }

    const url =
      `${API_CONFIG.VWORLD_BASE_URL}/req/data` +
      `?service=data` +
      `&request=GetFeature` +
      `&data=lp_pa_cbnd_bubun` +
      `&format=json` +
      `&geomFilter=POINT(${lon} ${lat})`;

    const json = await safeFetchJson(url, 'fetchParcelByLonLat', 1);
    if (json?.response?.status !== 'OK') return null;

    const feature = json?.response?.result?.featureCollection?.features?.[0] || null;
    if (feature) vworldCache.parcelData.set(cacheKey, feature);
    return feature;
  },

  async searchAddress(query, size = 10) {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];

    const cacheKey = `${normalized}_${size}`;
    if (vworldCache.geocoding.has(cacheKey)) {
      return vworldCache.geocoding.get(cacheKey);
    }

    const url =
      `${API_CONFIG.VWORLD_BASE_URL}/req/search` +
      `?service=search` +
      `&request=search` +
      `&version=2.0` +
      `&crs=EPSG:4326` +
      `&size=${size}` +
      `&page=1` +
      `&query=${encodeURIComponent(normalized)}` +
      `&type=ADDRESS` +
      `&category=parcel` +
      `&format=json` +
      `&errorformat=json`;

    const data = await safeFetchJson(url, 'searchAddress', 1);

    if (data?.response?.status === 'OK' && data?.response?.result?.items?.length > 0) {
      const items = data.response.result.items;
      vworldCache.geocoding.set(cacheKey, items);
      return items;
    }

    // Try again without category=parcel if no results
    if (normalized.length > 2) {
        const fallbackUrl = url.replace('&category=parcel', '');
        const fallbackData = await safeFetchJson(fallbackUrl, 'searchAddressFallback', 0);
        if (fallbackData?.response?.status === 'OK' && fallbackData?.response?.result?.items?.length > 0) {
            const items = fallbackData.response.result.items;
            vworldCache.geocoding.set(cacheKey, items);
            return items;
        }
    }

    return [];
  },

  async fetchLandCharacteristics(pnu) {
    if (!pnu) return null;

    if (vworldCache.landCharacteristics.has(pnu)) {
      return vworldCache.landCharacteristics.get(pnu);
    }

    const url =
      `${API_CONFIG.VWORLD_BASE_URL}/ned/data/getLandCharacteristics` +
      `?pnu=${encodeURIComponent(pnu)}` +
      `&format=json&numOfRows=1&pageNo=1`;

    const data = await safeFetchJson(url, 'fetchLandCharacteristics', 1);
    if (data) vworldCache.landCharacteristics.set(pnu, data);
    return data;
  },

  async fetchLadfrl(pnu) {
    if (!pnu) return null;

    if (vworldCache.ladfrl.has(pnu)) {
      return vworldCache.ladfrl.get(pnu);
    }

    const url =
      `${API_CONFIG.VWORLD_BASE_URL}/ned/data/ladfrlList` +
      `?pnu=${encodeURIComponent(pnu)}` +
      `&format=json&numOfRows=1&pageNo=1`;

    const data = await safeFetchJson(url, 'fetchLadfrl', 1);
    if (data) vworldCache.ladfrl.set(pnu, data);
    return data;
  }
};
