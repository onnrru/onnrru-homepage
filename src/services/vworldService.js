import axios from 'axios';
import { API_CONFIG } from '../config/api';

const vworldCache = {
    geocoding: new Map(),
    parcelData: new Map(),
};

/**
 * VWorld API Centralized Service
 */
export const VWorldService = {
    /**
     * Get parcel information by longitude and latitude (Reverse Geocoding / Data API)
     */
    async fetchParcelByLonLat(lon, lat) {
        const cacheKey = `${lon},${lat}`;
        if (vworldCache.parcelData.has(cacheKey)) {
            return vworldCache.parcelData.get(cacheKey);
        }

        const url = `${API_CONFIG.VWORLD_BASE_URL}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun` +
            `&format=json&geomFilter=POINT(${lon} ${lat})&key=${API_CONFIG.VWORLD_KEY}&domain=${window.location.hostname}`;

        try {
            const res = await fetch(url);
            const text = await res.text();

            if (text.trim().startsWith('<')) {
                console.error('VWorld returned HTML:', text.slice(0, 120));
                return null;
            }

            const json = JSON.parse(text);
            if (json?.response?.status !== 'OK') return null;

            const feature = json.response?.result?.featureCollection?.features?.[0] || null;
            if (feature) {
                vworldCache.parcelData.set(cacheKey, feature);
            }
            return feature;
        } catch (error) {
            console.error('fetchParcelByLonLat failed:', error);
            return null;
        }
    },

    /**
     * Search address or geocode a string to coordinates
     */
    async searchAddress(query) {
        if (vworldCache.geocoding.has(query)) {
            return vworldCache.geocoding.get(query);
        }

        const url = `${API_CONFIG.VWORLD_BASE_URL}/req/search?service=search&request=search&version=2.0` +
            `&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(query)}` +
            `&type=ADDRESS&category=parcel&format=json&errorformat=json` +
            `&key=${API_CONFIG.VWORLD_KEY}&domain=${window.location.hostname}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data?.response?.status === 'OK' && data.response.result?.items?.length > 0) {
                const result = data.response.result.items[0];
                vworldCache.geocoding.set(query, result);
                return result;
            }
            return null;
        } catch (error) {
            console.error('searchAddress failed for:', query, error);
            return null;
        }
    },

    /**
     * Fetch Land Characteristics (NED Data API)
     */
    async fetchLandCharacteristics(pnu) {
        const url = `${API_CONFIG.VWORLD_BASE_URL}/ned/data/getLandCharacteristics`;
        try {
            const res = await axios.get(url, {
                params: {
                    key: API_CONFIG.VWORLD_KEY,
                    domain: window.location.hostname,
                    pnu,
                    format: 'json',
                    numOfRows: 1,
                    pageNo: 1
                },
                timeout: 3000
            });
            // Handle some inconsistency in axios response vs fetch
            const d = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
            return d;
        } catch (error) {
            console.warn('fetchLandCharacteristics failed:', error);
            return null;
        }
    },

    /**
     * Fetch Land Parcel List (NED Data API) - Backup for Area/Jimok
     */
    async fetchLadfrl(pnu) {
        const url = `${API_CONFIG.VWORLD_BASE_URL}/ned/data/ladfrlList`;
        try {
            const res = await axios.get(url, {
                params: {
                    key: API_CONFIG.VWORLD_KEY,
                    domain: window.location.hostname,
                    pnu,
                    format: 'json',
                    numOfRows: 1,
                    pageNo: 1
                },
                timeout: 2000
            });
            return (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
        } catch (error) {
            console.warn('fetchLadfrl failed:', error);
            return null;
        }
    }
};
