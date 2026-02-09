import React, { useState } from 'react';

const MapSection = () => {
    // Mock Data for "Real Transaction" overlays
    const [markers] = useState([
        { id: 1, x: '50%', y: '40%', price: '6억 1700', unit: '만원/평', count: 3, type: 'APT' },
        { id: 2, x: '30%', y: '60%', price: '4억 1400', unit: '만원/평', count: 1, type: 'APT' },
        { id: 3, x: '70%', y: '30%', price: '5억 8000', unit: '만원/평', count: 5, type: 'APT' },
        { id: 4, x: '60%', y: '50%', price: 'TARGET', unit: '', count: 0, type: 'TARGET' },
    ]);

    const [activeTab, setActiveTab] = useState('real'); // 'real' or 'eum'

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group">

            {/* Map Placeholder (Simulating Google Maps) */}
            <div className="absolute inset-0 bg-[#e5e5e5] w-full h-full">
                {/* Background Grid to look like a map */}
                <div className="w-full h-full opacity-30" style={{
                    backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}></div>

                {/* Simulated Roads/Blocks */}
                <div className="absolute top-0 left-1/4 w-20 h-full bg-white/50 transform -skew-x-12 border-l border-r border-gray-300"></div>
                <div className="absolute top-1/3 left-0 w-full h-16 bg-white/50 transform skew-y-6 border-t border-b border-gray-300"></div>
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 pointer-events-none">
                {markers.map((m) => (
                    <div
                        key={m.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform hover:scale-110"
                        style={{ left: m.x, top: m.y }}
                    >
                        {m.type === 'TARGET' ? (
                            // Target Pin
                            <div className="relative">
                                <svg className="w-12 h-12 text-red-600 drop-shadow-xl" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    검토 대상지
                                </div>
                            </div>
                        ) : (
                            // Price Bubble
                            <div className="flex flex-col items-center">
                                <div className="bg-white/90 backdrop-blur-sm border-2 border-ink rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-xl text-ink">
                                    <div className="text-sm font-bold">{m.price}</div>
                                    <div className="text-[10px] text-gray-500">{m.unit}</div>
                                    <div className="mt-1 text-xs bg-gray-100 px-1.5 rounded text-gray-600">({m.count}건)</div>
                                </div>
                                <div className="w-0.5 h-4 bg-ink"></div>
                                <div className="w-2 h-2 rounded-full bg-ink"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Controls / Tabs */}
            <div className="absolute top-4 left-4 flex gap-2">
                <button
                    onClick={() => setActiveTab('real')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${activeTab === 'real' ? 'bg-ink text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    실거래가 분석
                </button>
                <button
                    onClick={() => setActiveTab('eum')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${activeTab === 'eum' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                    토지이음 지도
                </button>
            </div>

            {/* Euml Map Overlay (Folder effect) */}
            {activeTab === 'eum' && (
                <div className="absolute inset-4 bg-yellow-100/40 border-4 border-yellow-500/50 rounded-xl backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">토지이음 도면 오버레이</h3>
                        <p className="text-gray-500">지적편집도 및 용도지역 정보가<br />지도 위에 중첩되어 표시됩니다.</p>
                        <div className="mt-4 flex gap-2 justify-center">
                            <span className="w-4 h-4 rounded bg-yellow-400 border border-black/10"></span>
                            <span className="text-xs">주거지역</span>
                            <span className="w-4 h-4 rounded bg-pink-400 border border-black/10 ml-2"></span>
                            <span className="text-xs">상업지역</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapSection;
