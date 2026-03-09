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
    const x = Number(lon).toFixed(6);
    const y = Number(lat).toFixed(6);
    return `${x},${y}`;
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
                await sleep(300);
                return safeFetchJson(url, label, retry - 1);
            }
            console.warn(`${label} HTTP error:`, res.status, text.slice(0, 300));
            return null;
        }

        if (!text || !text.trim()) {
            if (retry > 0) {
                await sleep(300);
                return safeFetchJson(url, label, retry - 1);
            }
            console.warn(`${label} empty response`);
            return null;
        }

        if (text.trim().startsWith('<')) {
            if (retry > 0) {
                await sleep(300);
                return safeFetchJson(url, label, retry - 1);
            }
            console.warn(`${label} returned HTML:`, text.slice(0, 300));
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            if (retry > 0) {
                await sleep(300);
                return safeFetchJson(url, label, retry - 1);
            }
            console.warn(`${label} JSON parse error:`, parseError, text.slice(0, 300));
            return null;
        }
    } catch (error) {
        if (retry > 0) {
            await sleep(300);
            return safeFetchJson(url, label, retry - 1);
        }
        console.warn(`${label} failed:`, error);
        return null;
    }
}

/**
 * VWorld API Centralized Service
 * - key/domain 은 Netlify function 에서만 주입
 * - 프런트에서는 절대 key/domain 을 붙이지 않음
 */
export const VWorldService = {
    /**
     * Get parcel information by longitude and latitude
     */
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

        const json = await safeFetchJson(url, 'fetchParcelByLonLat');
        if (json?.response?.status !== 'OK') return null;

        const feature = json?.response?.result?.featureCollection?.features?.[0] || null;

        if (feature) {
            vworldCache.parcelData.set(cacheKey, feature);
        }

        return feature;
    },

    /**
     * Search addresses or geocode a string to coordinates (multi-result)
     */
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

        return [];
    },

    /**
     * Fetch Land Characteristics (NED Data API)
     */
    async fetchLandCharacteristics(pnu) {
        if (!pnu) return null;

        if (vworldCache.landCharacteristics.has(pnu)) {
            return vworldCache.landCharacteristics.get(pnu);
        }

        const url =
            `${API_CONFIG.VWORLD_BASE_URL}/ned/data/getLandCharacteristics` +
            `?pnu=${encodeURIComponent(pnu)}` +
            `&format=json` +
            `&numOfRows=1` +
            `&pageNo=1`;

        const data = await safeFetchJson(url, 'fetchLandCharacteristics', 1);

        if (data) {
            vworldCache.landCharacteristics.set(pnu, data);
        }

        return data;
    },

    /**
     * Fetch Land Parcel List (NED Data API)
     */
    async fetchLadfrl(pnu) {
        if (!pnu) return null;

        if (vworldCache.ladfrl.has(pnu)) {
            return vworldCache.ladfrl.get(pnu);
        }

        const url =
            `${API_CONFIG.VWORLD_BASE_URL}/ned/data/ladfrlList` +
            `?pnu=${encodeURIComponent(pnu)}` +
            `&format=json` +
            `&numOfRows=1` +
            `&pageNo=1`;

        const data = await safeFetchJson(url, 'fetchLadfrl', 1);

        if (data) {
            vworldCache.ladfrl.set(pnu, data);
        }

        return data;
    }
};
