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
    const [analysisData, setAnalysisData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(AREA_CATEGORIES[0]);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [regionLabels, setRegionLabels] = useState({ gu: '행정구', dong: '행정동' });
    const [selectedPeriod, setSelectedPeriod] = useState(36); // months
    const [trendDataType, setTrendDataType] = useState('avg'); // 'avg' or 'count'

    useEffect(() => {
        const loadData = async () => {
            if (!selectedAddress || !selectedAddress.pnu) {
                setAnalysisData(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // pnu is 19 chars: 0-5 is Sigungu (LAWD_CD), 5-10 is Dong code
                const lawdCd = selectedAddress.pnu.substring(0, 5);

                const addressParts = selectedAddress.roadAddr?.split(' ') || selectedAddress.jibunAddr?.split(' ') || [];

                // 1. Identify broader unit (Gu or Gun/Si)
                const sigunguPart = addressParts.find(part => part.endsWith('구') || part.endsWith('군') || part.endsWith('시')) || '행정구';

                // 2. Identify minimum unit (Dong or Eup/Myeon + Ri)
                let targetUnitName = '';
                const dongPart = addressParts.find(part => part.endsWith('동'));
                const eupMyeonPart = addressParts.find(part => part.endsWith('읍') || part.endsWith('면'));
                const riPart = addressParts.find(part => part.endsWith('리'));

                if (dongPart) {
                    targetUnitName = dongPart;
                } else if (eupMyeonPart) {
                    targetUnitName = riPart ? `${eupMyeonPart} ${riPart}` : eupMyeonPart;
                } else {
                    targetUnitName = addressParts[addressParts.length - 1] || '';
                }

                if (lawdCd && targetUnitName) {
                    setRegionLabels({ gu: sigunguPart, dong: targetUnitName });

                    const rawData = await fetchApartmentTransactions(lawdCd, selectedPeriod);
                    const processed = processTransactionData(rawData, targetUnitName, selectedPeriod);
                    setAnalysisData(processed);
                    setSelectedApartment(null); // Reset selection on new area
                } else {
                    setAnalysisData(null);
                }
            } catch (error) {
                console.error("Failed to load real estate data:", error);
                setAnalysisData(null);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedAddress, selectedPeriod]);

    // Format data for Bar Chart
    const barChartData = useMemo(() => {
        if (!analysisData) return [];

        const data = [];

        // Add apartments
        analysisData.apartments.forEach(apt => {
            const catData = apt.categories[selectedCategory];
            if (catData && catData.count > 0) {
                data.push({
                    name: apt.apartmentName,
                    avg: catData.avg,
                    count: catData.count,
                    type: 'apartment'
                });
            }
        });

        // Add overall Dong average securely at the end
        const dongAvg = analysisData.dongOverallAverages[selectedCategory];
        if (dongAvg > 0) {
            let totalCategoryCount = 0;
            analysisData.apartments.forEach(apt => {
                if (apt.categories[selectedCategory]) {
                    totalCategoryCount += apt.categories[selectedCategory].count;
                }
            });

            data.push({
                name: `${regionLabels.dong} 전체 평균`,
                avg: dongAvg,
                count: totalCategoryCount,
                type: 'average'
            });
        }

        return data;
    }, [analysisData, selectedCategory, regionLabels]);

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

    if (analysisData && analysisData.apartments.length === 0) {
        return (
            <div className="h-64 bg-white border-t border-gray-200 flex items-center justify-center text-gray-400">
                해당 지역에 3년간 아파트 실거래 내역이 없습니다.
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
                            추이 비교 <span className="text-xs font-normal text-gray-500">(3개월 단위)</span>
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
