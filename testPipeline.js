import { processTransactionData } from './src/utils/apartmentAnalysis.js';
import { fetchApartmentTransactions } from './src/services/realEstateApi.js';

async function testFetch() {
    try {
        console.log("Fetching API for 11710 (Songpa-gu), looking for target: 잠실동");
        const rawData = await fetchApartmentTransactions('11710', 36);
        console.log(`Fetched ${rawData.length} transactions total.`);
        if (rawData.length > 0) {
            console.log("Sample transaction:", rawData[0]);

            // Try matching
            const targetDong = '잠실동';
            const matched = rawData.filter(t => t.dongName === targetDong);
            console.log(`Matched ${matched.length} transactions for '${targetDong}'.`);
            if (matched.length > 0) {
                console.log("Sample matched transaction:", matched[0]);
            }
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}
testFetch();
