import { API_CONFIG } from '../config/api';

/**
 * Fetch apartment real transaction data from MOLIT API.
 * The API requires LAWD_CD (5 digits) and DEAL_YMD (YYYYMM).
 * Since we need 3 years of data, we make multiple requests.
 */

// Helper to get YYYYMM strings for the past N months
export const getPastMonths = (numMonths) => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < numMonths; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push(`${year}${month}`);
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

// Parse XML response from MOLIT API
const parseXmlToJSON = (xmlText) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Check for errors
    const resultCode = xmlDoc.getElementsByTagName('resultCode')[0]?.textContent;
    if (resultCode !== '00') {
        const resultMsg = xmlDoc.getElementsByTagName('resultMsg')[0]?.textContent;
        console.error('API Error:', resultMsg);
        return [];
    }

    const items = xmlDoc.getElementsByTagName('item');
    const result = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Helper to get text content safely
        const getText = (tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || '';

        // The price comes with commas, remove them and convert to Number
        const priceStr = getText('dealAmount').replace(/,/g, '');
        const price = Number(priceStr);

        result.push({
            // Core identifiers
            apartmentName: getText('aptNm'),
            dongName: getText('umdNm').trim(), // Often contains leading space in API
            jibun: getText('jibun'),

            // Transaction Details
            dealYear: getText('dealYear'),
            dealMonth: getText('dealMonth'),
            dealDay: getText('dealDay'),
            dealDate: `${getText('dealYear')}-${getText('dealMonth').padStart(2, '0')}-${getText('dealDay').padStart(2, '0')}`,
            price: price, // in 10,000 KRW

            // Property details
            area: Number(getText('excluUseAr')),
            floor: Number(getText('floor')),
            buildYear: getText('buildYear')
        });
    }

    return result;
};

/**
 * Fetch transactions for a specific lawdCd over past months.
 * @param {string} lawdCd - 5 digit region code (Sigungu)
 * @param {number} monthsCount - number of months to fetch (e.g. 36 for 3 years)
 */
export const fetchApartmentTransactions = async (lawdCd, monthsCount = 36) => {
    try {
        const months = getPastMonths(monthsCount);
        const { MOLIT_BASE_URL, MOLIT_KEY, ENDPOINTS } = API_CONFIG;

        // Prepare URL base
        // The key provided by the user is already URL-encoded.
        const encodedKey = MOLIT_KEY;

        const fetchMonthData = async (dealYmd) => {
            const url = `${MOLIT_BASE_URL}${ENDPOINTS.APT_TRADE}?serviceKey=${encodedKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=1000&pageNo=1`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to fetch data for ${dealYmd}: ${response.status}`);
                return [];
            }

            const xmlText = await response.text();
            return parseXmlToJSON(xmlText);
        };

        // Batch requests in groups of 6 to avoid overwhelming the browser/API
        const batchSize = 6;
        let allTransactions = [];

        for (let i = 0; i < months.length; i += batchSize) {
            const batchMonths = months.slice(i, i + batchSize);
            const batchPromises = batchMonths.map(month => fetchMonthData(month));

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    allTransactions = allTransactions.concat(result.value);
                }
            });

            // Optional: short delay between batches to be nice to API
            if (i + batchSize < months.length) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        return allTransactions;
    } catch (error) {
        console.error("Error fetching apartment transactions:", error);
        throw error;
    }
};
