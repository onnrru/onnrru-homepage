import React from 'react';

const BottomPanel = () => {
    return (
        <div className="h-64 bg-white border-t border-gray-200 flex overflow-hidden">
            {/* Chart 1: Price Trends */}
            <div className="flex-1 p-6 border-r border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1 h-4 bg-ink rounded-full"></span>
                        실거래가 추이
                    </h3>
                    <div className="text-xs text-gray-400">최근 1년 기준</div>
                </div>

                {/* Mock Bar Chart */}
                <div className="flex-1 flex items-end justify-between gap-2 px-4 relative">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-t border-gray-100 w-full"></div>
                        <div className="border-t border-gray-100 w-full"></div>
                        <div className="border-t border-gray-100 w-full"></div>
                        <div className="border-t border-gray-100 w-full border-gray-300"></div>
                    </div>

                    {/* Bars */}
                    {[40, 60, 45, 70, 55, 80, 65, 90, 75, 60, 85, 95].map((h, i) => (
                        <div key={i} className="w-full bg-blue-100 hover:bg-blue-200 rounded-t-sm relative group transition-all" style={{ height: `${h}%` }}>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {h}00만
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-4">
                    <span>24.01</span>
                    <span>24.06</span>
                    <span>24.12</span>
                </div>
            </div>

            {/* Chart 2: Transaction Volume */}
            <div className="w-[400px] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1 h-4 bg-ink rounded-full"></span>
                        거래량 분석
                    </h3>
                </div>

                {/* Mock Line Chart */}
                <div className="flex-1 relative flex items-center justify-center border border-gray-100 bg-gray-50 rounded-lg">
                    <svg viewBox="0 0 100 40" className="w-full h-full p-4 overflow-visible">
                        <polyline
                            fill="none"
                            stroke="#4B5563"
                            strokeWidth="2"
                            points="0,30 10,25 20,35 30,20 40,25 50,15 60,20 70,10 80,15 90,5 100,20"
                        />
                        <circle cx="20" cy="35" r="2" fill="white" stroke="#4B5563" />
                        <circle cx="50" cy="15" r="2" fill="white" stroke="#4B5563" />
                        <circle cx="90" cy="5" r="2" fill="white" stroke="#4B5563" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default BottomPanel;
