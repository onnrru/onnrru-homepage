/**
 * Determine the size category for a given area (in ㎡).
 */
export const getAreaCategory = (area) => {
    if (area >= 50 && area < 80) return "50-80㎡";
    if (area >= 80 && area < 85) return "80-85㎡";
    if (area >= 85 && area < 110) return "85-110㎡";
    if (area >= 110 && area < 130) return "110-130㎡";
    if (area >= 130) return "130㎡+";
    return null; // Ignore areas under 50㎡ as per requirements
};

export const AREA_CATEGORIES = ["50-80㎡", "80-85㎡", "85-110㎡", "110-130㎡", "130㎡+"];

/**
 * Get 3-month interval periods for the last 3 years.
 * Format: "YYYY.MM" start period
 */
const getTrimesters = () => {
    const periods = [];
    const date = new Date();
    // Start from current month
    let year = date.getFullYear();
    let month = date.getMonth() + 1;

    for (let i = 0; i < 12; i++) { // 12 trimesters = 36 months
        // e.g. "2024.1" if month is 3, "2023.10" if month is 12
        const periodKey = `${year}.Q${Math.ceil(month / 3)}`; // Custom key like 2024.Q1
        // We can just use the start month of the trimester for the label
        const startMonth = month - 2;
        let pYear = year;
        let pMonth = startMonth;
        if (pMonth <= 0) {
            pYear -= 1;
            pMonth += 12;
        }

        let endMonth = month;
        let endYear = year;

        // The period represents past 3 months ending in `year-month`
        const label = `${pYear}.${String(pMonth).padStart(2, '0')} ~ ${String(endMonth).padStart(2, '0')}`;
        periods.unshift({ key: i, label, endYear, endMonth, pYear, pMonth }); // oldest first

        // Go back 3 months
        month -= 3;
        if (month <= 0) {
            year -= 1;
            month += 12;
        }
    }
    return periods;
};

// Helper to determine the trimester index (0-11, 0 being oldest) for a deal date
const getTrimesterIndex = (dealYear, dealMonth, periods) => {
    const dYear = Number(dealYear);
    const dMonth = Number(dealMonth);

    // Find which period it fits into
    // Because periods are disjoint 3-month windows
    for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        // check if (dYear, dMonth) falls in [pYear/pMonth, endYear/endMonth]
        // Convert to absolute months
        const dealAbsolute = dYear * 12 + dMonth;
        const startAbsolute = p.pYear * 12 + p.pMonth;
        const endAbsolute = p.endYear * 12 + p.endMonth;

        if (dealAbsolute >= startAbsolute && dealAbsolute <= endAbsolute) {
            return i;
        }
    }
    return -1; // Out of range (older than 3 years or future)
};

/**
 * Process raw API data.
 * @param {Array} rawData - Array of transactions from API
 * @param {string} targetDong - The selected Dong name
 */
export const processTransactionData = (rawData, targetDong) => {
    const periods = getTrimesters();

    // 1. Filter out areas under 50㎡ and categorize
    const categorizedData = rawData.map(t => ({
        ...t,
        category: getAreaCategory(t.area)
    })).filter(t => t.category !== null);

    // Initialize structures
    const apartmentStats = {}; // By [apartmentName][category]
    const dongTrendStats = {}; // By [category][periodIndex]
    const guTrendStats = {}; // By [category][periodIndex]

    // Initialize trend arrays
    AREA_CATEGORIES.forEach(cat => {
        dongTrendStats[cat] = Array(12).fill(0).map(() => ({ totalAmount: 0, count: 0, avg: 0 }));
        guTrendStats[cat] = Array(12).fill(0).map(() => ({ totalAmount: 0, count: 0, avg: 0 }));
    });

    categorizedData.forEach(tx => {
        const cat = tx.category;
        const price = tx.price;
        const isTargetDong = tx.dongName === targetDong;

        const periodIdx = getTrimesterIndex(tx.dealYear, tx.dealMonth, periods);

        // Gu Trend (all transactions in the data are for the Gu)
        if (periodIdx !== -1) {
            guTrendStats[cat][periodIdx].totalAmount += price;
            guTrendStats[cat][periodIdx].count += 1;
        }

        if (isTargetDong) {
            // Dong Trend
            if (periodIdx !== -1) {
                dongTrendStats[cat][periodIdx].totalAmount += price;
                dongTrendStats[cat][periodIdx].count += 1;
            }

            // Apartment Aggregate
            const aptKey = tx.apartmentName;
            if (!apartmentStats[aptKey]) {
                apartmentStats[aptKey] = {};
            }
            if (!apartmentStats[aptKey][cat]) {
                apartmentStats[aptKey][cat] = {
                    totalAmount: 0,
                    count: 0,
                    // Store historical data for line chart
                    history: Array(12).fill(0).map(() => ({ totalAmount: 0, count: 0, avg: 0 }))
                };
            }

            // Overall aggregate
            apartmentStats[aptKey][cat].totalAmount += price;
            apartmentStats[aptKey][cat].count += 1;

            // Historical aggregate
            if (periodIdx !== -1) {
                apartmentStats[aptKey][cat].history[periodIdx].totalAmount += price;
                apartmentStats[aptKey][cat].history[periodIdx].count += 1;
            }
        }
    });

    // Calculate averages
    AREA_CATEGORIES.forEach(cat => {
        for (let i = 0; i < 12; i++) {
            if (guTrendStats[cat][i].count > 0) {
                guTrendStats[cat][i].avg = Math.round(guTrendStats[cat][i].totalAmount / guTrendStats[cat][i].count);
            }
            if (dongTrendStats[cat][i].count > 0) {
                dongTrendStats[cat][i].avg = Math.round(dongTrendStats[cat][i].totalAmount / dongTrendStats[cat][i].count);
            }
        }
    });

    const apartments = Object.keys(apartmentStats).map(aptName => {
        const catStats = apartmentStats[aptName];

        const processedCatStats = {};
        for (const cat in catStats) {
            const stat = catStats[cat];
            stat.history.forEach(h => {
                if (h.count > 0) h.avg = Math.round(h.totalAmount / h.count);
            });

            processedCatStats[cat] = {
                totalAmount: stat.totalAmount,
                count: stat.count,
                avg: Math.round(stat.totalAmount / stat.count),
                history: stat.history
            };
        }

        return {
            apartmentName: aptName,
            categories: processedCatStats
        };
    });

    // Calculate overall dong average per category for the bar chart
    const dongOverallAverages = {};
    AREA_CATEGORIES.forEach(cat => {
        let catTotal = 0;
        let catCount = 0;
        apartments.forEach(apt => {
            if (apt.categories[cat]) {
                catTotal += apt.categories[cat].totalAmount;
                catCount += apt.categories[cat].count;
            }
        });
        dongOverallAverages[cat] = catCount > 0 ? Math.round(catTotal / catCount) : 0;
    });

    return {
        periods: periods.map(p => p.label),
        apartments,
        dongTrendStats,
        guTrendStats,
        dongOverallAverages
    };
};
