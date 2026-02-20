import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, CartesianGrid, Legend, LabelList
} from 'recharts';
import { fetchApartmentTransactions } from '../../services/realEstateApi';
import { processTransactionData, AREA_CATEGORIES } from '../../utils/apartmentAnalysis';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-1 text-xs">
                        {entry.dataKey === 'avg' && (
                            <span style={{ color: entry.color }}>평균 실거래가: {(entry.value / 10000).toFixed(2)}억원</span>
                        )}
                        {entry.payload.count !== undefined && (
                            <span className="text-gray-500">거래건수: {entry.payload.count}건</span>
                        )}
                        {entry.payload.avgArea !== undefined && (
                            <span className="text-gray-500">
                                전용면적 평균: {entry.payload.avgArea.toFixed(1)}㎡ ({(entry.payload.avgArea * 0.3025).toFixed(1)} py)
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const TrendTooltip = ({ active, payload, label, trendDataType }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm min-w-[150px]">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs mb-1 gap-4">
                        <span style={{ color: entry.color }}>{entry.name}:</span>
                        <span>
                            {trendDataType === 'avg'
                                ? `${(entry.value / 10000).toFixed(2)}억원`
                                : `${entry.value}건`}
                            {trendDataType === 'avg' && entry.payload[`${entry.dataKey.split('Avg')[0]}Count`] !== undefined
                                ? ` (${entry.payload[`${entry.dataKey.split('Avg')[0]}Count`]}건)`
                                : ''}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === '-') return null;
    return (
        <text x={x + width / 2} y={y - 5} fill="#6b7280" fontSize="10" textAnchor="middle">
            {value}건
        </text>
    );
};

const BottomPanel = ({ selectedAddress }) => {
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(AREA_CATEGORIES[0]);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [regionLabels, setRegionLabels] = useState({ gu: '행정구', dong: '행정동' });
    const [selectedPeriod, setSelectedPeriod] = useState(36); // months
    const [trendDataType, setTrendDataType] = useState('avg'); // 'avg' or 'count'

    const [rawTxData, setRawTxData] = useState([]);
    const [targetUnitName, setTargetUnitName] = useState('');
    const [analyzedAddressPnu, setAnalyzedAddressPnu] = useState(null);

    const loadData = async () => {
        if (!selectedAddress || !selectedAddress.pnu) {
            setRawTxData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setAnalyzedAddressPnu(selectedAddress.pnu);
        try {
            // pnu is 19 chars: 0-5 is Sigungu (LAWD_CD), 5-10 is Dong code
            const lawdCd = selectedAddress.pnu.substring(0, 5);

            const addressParts = selectedAddress.roadAddr?.split(' ') || selectedAddress.jibunAddr?.split(' ') || [];

            // Extract Si/Do precisely (First element)
            const sidoPart = addressParts[0] || '시/도';

            // 1. Identify Sigungu (행정구/군/시)
            let sigunguPart = '';
            const possibleSigungu = addressParts.filter((p, i) => i > 0 && (p.endsWith('구') || p.endsWith('군') || p.endsWith('시')));

            if (possibleSigungu.length > 0) {
                sigunguPart = possibleSigungu[0];
            } else if (addressParts.length >= 2) {
                sigunguPart = addressParts[1];
            } else {
                sigunguPart = '행정구';
            }

            // 2. Identify minimum unit (Dong or Eup/Myeon + Ri)
            let targetUnitName = '';
            let primaryUnit = '';

            const dongPart = addressParts.find(part => part.endsWith('동'));
            const eupMyeonPart = addressParts.find(part => part.endsWith('읍') || part.endsWith('면'));
            const riPart = addressParts.find(part => part.endsWith('리'));

            if (dongPart) {
                targetUnitName = dongPart;
                primaryUnit = dongPart;
            } else if (eupMyeonPart) {
                // For Trend Comparison, we show the Primary Unit (e.g. 면/읍) as the 'Gu/Dong' equivalent line
                // and the 'Ri' as the specific local level if applicable.
                primaryUnit = eupMyeonPart;
                targetUnitName = riPart ? `${eupMyeonPart} ${riPart}` : eupMyeonPart;
            } else {
                targetUnitName = addressParts[addressParts.length - 1] || '';
                primaryUnit = targetUnitName;
            }

            if (lawdCd && targetUnitName) {
                // For the legend, we want:
                // Gu -> Sigungu (e.g., 송파구, 양평군)
                // Dong -> primaryUnit (e.g., 방이동, 강상면)
                setRegionLabels({ gu: sigunguPart, dong: primaryUnit, sido: sidoPart });
                setTargetUnitName(targetUnitName);

                // Fetch 5 years explicitly ONCE for the trend chart
                const rawData = await fetchApartmentTransactions(lawdCd, 60);
                setRawTxData(rawData || []);
                setSelectedApartment(null);
            } else {
                setRawTxData([]);
            }
        } catch (error) {
            console.error("Failed to load real estate data:", error);
            setRawTxData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset analyzedAddressPnu when selectedAddress changes to prompt re-analysis
        setAnalyzedAddressPnu(null);
        setRawTxData([]); // Clear previous data
        setLoading(false); // Ensure loading is off if no address or new address
    }, [selectedAddress]);

    // Static 5 Year Analysis for Trend Chart
    const analysisData = useMemo(() => {
        if (!rawTxData || rawTxData.length === 0 || !targetUnitName) return null;
        return processTransactionData(rawTxData, targetUnitName, 60); // 60 months fixed
    }, [rawTxData, targetUnitName]);

    // Local filter and calculate averages for dynamic Bar Chart
    const barChartData = useMemo(() => {
        if (!rawTxData || rawTxData.length === 0 || !targetUnitName) return [];

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - selectedPeriod);
        const cutoffAbsolute = cutoffDate.getFullYear() * 12 + (cutoffDate.getMonth() + 1);

        // Filter transactions within the selectedPeriod
        const filteredTx = rawTxData.filter(tx => {
            const txAbsolute = Number(tx.dealYear) * 12 + Number(tx.dealMonth);
            return txAbsolute >= cutoffAbsolute;
        });

        const aptStats = {};
        let totalDongAmount = 0;
        let totalDongCount = 0;
        let totalDongArea = 0;

        filteredTx.forEach(tx => {
            const cat = processTransactionData.getAreaCategory ? processTransactionData.getAreaCategory(tx.area) : null;
            // Hacky fallback if export is missing, reuse the logic:
            let category = null;
            if (tx.area >= 50 && tx.area < 80) category = "50-80㎡";
            else if (tx.area >= 80 && tx.area < 85) category = "80-85㎡";
            else if (tx.area >= 85 && tx.area < 110) category = "85-110㎡";
            else if (tx.area >= 110 && tx.area < 130) category = "110-130㎡";
            else if (tx.area >= 130) category = "130㎡+";

            if (category !== selectedCategory) return;

            const txDong = String(tx.dongName || '').trim();
            const tDong = String(targetUnitName || '').trim();
            const isTargetDong = txDong.includes(tDong) || tDong.includes(txDong) || txDong === tDong;

            if (!isTargetDong) return;

            // Apartment level
            const aptName = tx.apartmentName;
            if (!aptStats[aptName]) aptStats[aptName] = { total: 0, count: 0, totalArea: 0 };
            aptStats[aptName].total += tx.price;
            aptStats[aptName].count += 1;
            aptStats[aptName].totalArea += tx.area;

            // Dong level
            totalDongAmount += tx.price;
            totalDongCount += 1;
            totalDongArea += tx.area;
        });

        const data = Object.keys(aptStats).map(aptName => ({
            name: aptName,
            avg: Math.round(aptStats[aptName].total / aptStats[aptName].count),
            count: aptStats[aptName].count,
            avgArea: aptStats[aptName].totalArea / aptStats[aptName].count,
            type: 'apartment'
        }));

        if (totalDongCount > 0) {
            data.push({
                name: `${regionLabels.dong} 전체 평균`,
                avg: Math.round(totalDongAmount / totalDongCount),
                count: totalDongCount,
                avgArea: totalDongArea / totalDongCount,
                type: 'average'
            });
        }

        return data;
    }, [rawTxData, targetUnitName, selectedCategory, selectedPeriod, regionLabels]);

    // Format data for Line Chart (Trend)
    const lineChartData = useMemo(() => {
        if (!analysisData) return [];

        const data = [];
        const { periods, dongTrendStats, guTrendStats, apartments } = analysisData;

        const dongTrend = dongTrendStats[selectedCategory];
        const guTrend = guTrendStats[selectedCategory];

        let aptTrend = null;
        if (selectedApartment) {
            const apt = apartments.find(a => a.apartmentName === selectedApartment);
            if (apt && apt.categories[selectedCategory]) {
                aptTrend = apt.categories[selectedCategory].history;
            }
        }

        periods.forEach((periodLabel, i) => {
            const item = {
                period: periodLabel,
                dongAvg: trendDataType === 'avg' ? (dongTrend[i].avg || null) : dongTrend[i].count,
                dongCount: dongTrend[i].count,
                guAvg: trendDataType === 'avg' ? (guTrend[i].avg || null) : guTrend[i].count,
                guCount: guTrend[i].count,
            };

            if (aptTrend) {
                item.aptAvg = trendDataType === 'avg' ? (aptTrend[i].avg || null) : aptTrend[i].count;
                item.aptCount = aptTrend[i].count;
            }

            data.push(item);
        });

        return data;
    }, [analysisData, selectedCategory, selectedApartment, trendDataType]);

    if (loading) {
        return (
            <div className="h-64 bg-white border-t border-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-500">실거래가 데이터를 불러오는 중... (최대 10초)</span>
            </div>
        );
    }

    if (!selectedAddress) {
        return (
            <div className="h-64 bg-white border-t border-gray-200 flex items-center justify-center text-gray-400">
                지도에서 필지를 선택하거나 주소를 검색하면 아파트 실거래가 분석이 표시됩니다.
            </div>
        );
    }

    if (selectedAddress.pnu !== analyzedAddressPnu) {
        const displayName = selectedAddress.roadAddr || selectedAddress.jibunAddr || selectedAddress.address || '선택된 대상지';
        return (
            <div className="h-64 bg-white border-t border-gray-200 flex flex-col gap-4 items-center justify-center">
                <div className="text-gray-600 font-medium text-sm">
                    <span className="text-blue-600 font-bold">[{displayName}]</span> 주변의 아파트 실거래가를 분석하시겠습니까?
                </div>
                <button
                    onClick={loadData}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow font-bold transition-all text-sm flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    분석하기
                </button>
            </div>
        );
    }

    if (!rawTxData || rawTxData.length === 0) {
        return (
            <div className="h-64 bg-white border-t border-gray-200 flex items-center justify-center text-gray-400">
                해당 지역에 최근 실거래 내역이 없습니다.
            </div>
        );
    }

    return (
        <div className="h-72 bg-white border-t border-gray-200 flex flex-col overflow-hidden">
            {/* Area Category Tabs */}
            <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">전용면적 구분</span>
                <div className="flex gap-2">
                    {AREA_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                setSelectedApartment(null);
                            }}
                            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors border ${selectedCategory === cat
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chart 1: Apartment Prices */}
                <div className="flex-1 p-3 border-r border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-2 px-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span className="w-1 h-3 bg-ink rounded-full"></span>
                            아파트별 평균 실거래가
                            <span className="text-xs font-normal text-gray-500">
                                ({selectedPeriod === 12 ? '1년' : selectedPeriod === 36 ? '3년' : '5년'})
                            </span>
                        </h3>
                        <div className="flex bg-gray-100 rounded-md p-0.5">
                            <button onClick={() => setSelectedPeriod(6)} className={`px-2 py-1 text-[10px] rounded ${selectedPeriod === 6 ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>6개월</button>
                            <button onClick={() => setSelectedPeriod(12)} className={`px-2 py-1 text-[10px] rounded ${selectedPeriod === 12 ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>1년</button>
                            <button onClick={() => setSelectedPeriod(36)} className={`px-2 py-1 text-[10px] rounded ${selectedPeriod === 36 ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>3년</button>
                            <button onClick={() => setSelectedPeriod(60)} className={`px-2 py-1 text-[10px] rounded ${selectedPeriod === 60 ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>5년</button>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative">
                        {barChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={40}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${value > 0 ? (value / 10000).toFixed(2) + '억' : '0'}`}
                                        width={45}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                    <Bar
                                        dataKey="avg"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                        onClick={(data) => {
                                            if (data && data.type === 'apartment') {
                                                setSelectedApartment(data.name === selectedApartment ? null : data.name);
                                            }
                                        }}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                    >
                                        <LabelList dataKey="count" content={<CustomBarLabel />} />
                                        {barChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.type === 'average' ? '#10b981' : // Green for average
                                                        entry.name === selectedApartment ? '#2563eb' : // Blue for selected
                                                            '#60a5fa' // Light blue for others
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                해당 면적의 거래 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Trends */}
                <div className="flex-1 p-3 flex flex-col">
                    <div className="flex justify-between items-center mb-2 px-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span className="w-1 h-3 bg-ink rounded-full"></span>
                            추이 비교 <span className="text-xs font-normal text-gray-500">(3개월 단위, 5년 고정)</span>
                        </h3>
                        <div className="flex bg-gray-100 rounded-md p-0.5">
                            <button onClick={() => setTrendDataType('avg')} className={`px-2 py-1 text-[10px] rounded ${trendDataType === 'avg' ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>평균매매가</button>
                            <button onClick={() => setTrendDataType('count')} className={`px-2 py-1 text-[10px] rounded ${trendDataType === 'count' ? 'bg-white shadow-sm font-bold text-primary' : 'text-gray-500 hover:text-gray-700'}`}>거래수</button>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 9, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={2} // Show fewer labels to avoid crowding
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => trendDataType === 'avg'
                                        ? `${value > 0 ? (value / 10000).toFixed(2) + '억' : '0'}`
                                        : `${value}건`}
                                    width={45}
                                />
                                <Tooltip content={<TrendTooltip trendDataType={trendDataType} />} />
                                <Legend wrapperStyle={{ fontSize: '11px', bottom: 0 }} />

                                <Line
                                    type="monotone"
                                    dataKey="guAvg"
                                    name={`${regionLabels.gu} 평균`}
                                    stroke="#9ca3af"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#9ca3af' }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="dongAvg"
                                    name={`${regionLabels.dong} 평균`}
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#10b981' }}
                                    connectNulls
                                />
                                {selectedApartment && (
                                    <Line
                                        type="monotone"
                                        dataKey="aptAvg"
                                        name={`선택: ${selectedApartment}`}
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563eb' }}
                                        connectNulls
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BottomPanel;
