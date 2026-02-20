import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, CartesianGrid, Legend
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
                            <span style={{ color: entry.color }}>평균 실거래가: {entry.value?.toLocaleString()}만원</span>
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

const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm min-w-[150px]">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs mb-1">
                        <span style={{ color: entry.color }}>{entry.name}:</span>
                        <span>{entry.value?.toLocaleString()}만원
                            {entry.payload[`${entry.dataKey.split('Avg')[0]}Count`] ? ` (${entry.payload[`${entry.dataKey.split('Avg')[0]}Count`]}건)` : ''}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BottomPanel = ({ selectedAddress }) => {
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(AREA_CATEGORIES[0]);
    const [selectedApartment, setSelectedApartment] = useState(null);

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

                // Get dong name from address (e.g., "서울특별시 강남구 역삼동" -> "역삼동")
                const addressParts = selectedAddress.roadAddr?.split(' ') || selectedAddress.jibunAddr?.split(' ') || [];
                const dongName = addressParts.find(part => part.endsWith('동') || part.endsWith('읍') || part.endsWith('면')) || '';

                if (lawdCd && dongName) {
                    const rawData = await fetchApartmentTransactions(lawdCd, 36); // 3 years
                    const processed = processTransactionData(rawData, dongName);
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
    }, [selectedAddress]);

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
            data.push({
                name: '동 전체 평균',
                avg: dongAvg,
                count: '-', // we could calculate total count if needed
                type: 'average'
            });
        }

        return data;
    }, [analysisData, selectedCategory]);

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
                dongAvg: dongTrend[i].avg || null,
                dongCount: dongTrend[i].count,
                guAvg: guTrend[i].avg || null,
                guCount: guTrend[i].count,
            };

            if (aptTrend) {
                item.aptAvg = aptTrend[i].avg || null;
                item.aptCount = aptTrend[i].count;
            }

            data.push(item);
        });

        return data;
    }, [analysisData, selectedCategory, selectedApartment]);

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
            <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex gap-2">
                {AREA_CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedApartment(null);
                        }}
                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedCategory === cat
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chart 1: Apartment Prices */}
                <div className="flex-1 p-3 border-r border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-2 px-3">
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span className="w-1 h-3 bg-ink rounded-full"></span>
                            아파트별 평균 실거래가
                        </h3>
                        <div className="text-[10px] text-gray-400">해당 면적형 기준</div>
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
                                        tickFormatter={(value) => `${value > 0 ? (value / 10000).toFixed(1) + '억' : '0'}`}
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
                            3년 추이 비교 (3개월 단위)
                        </h3>
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
                                    tickFormatter={(value) => `${value > 0 ? (value / 10000).toFixed(1) + '억' : '0'}`}
                                    width={45}
                                />
                                <Tooltip content={<TrendTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', bottom: 0 }} />

                                <Line
                                    type="monotone"
                                    dataKey="guAvg"
                                    name="행정구 평균"
                                    stroke="#9ca3af"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#9ca3af' }}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="dongAvg"
                                    name="행정동 평균"
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
