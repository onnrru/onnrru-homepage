import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real'); // 'real' or 'eum'

    // Mock Data for "Real Transaction" overlays
    const [markers] = useState([
        { id: 1, x: '50%', y: '40%', price: '6억 1700', unit: '만원/평', count: 3, type: 'APT' },
        { id: 2, x: '30%', y: '60%', price: '4억 1400', unit: '만원/평', count: 1, type: 'APT' },
        { id: 3, x: '70%', y: '30%', price: '5억 8000', unit: '만원/평', count: 5, type: 'APT' },
    ]);

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map
    useEffect(() => {
        const scriptId = 'vworld-map-script';

        const loadScript = () => {
            const script = document.createElement('script');
            script.id = scriptId;
            // Add domain parameter as required for authorized domain
            script.src = `https://map.vworld.kr/js/vworldMapInit.js.do?version=2.0&apiKey=${API_CONFIG.VWORLD_KEY}&domain=https://onnrru.com`;
            script.async = true;
            script.onload = () => {
                setTimeout(() => initMap(), 500); // Slight delay to ensure internal inits
            };
            script.onerror = () => {
                setMapError("지도를 불러올 수 없습니다. (스크립트 로드 실패)");
                setIsMapLoading(false);
            };
            document.body.appendChild(script);
        };

        if (!document.getElementById(scriptId)) {
            loadScript();
        } else {
            if (window.vw) {
                initMap();
            } else {
                // Script exists but maybe not loaded? Retry
                setTimeout(() => {
                    if (window.vw) initMap();
                    else loadScript(); // Force reload if super stuck? No, just wait.
                }, 1000);
            }
        }

        function initMap() {
            if (!window.vw) {
                console.error("VWorld 'vw' object not found");
                return;
            }
            if (mapObj) return;

            try {
                const options = {
                    mapId: "vworld_map_container",
                    initPosition: new window.vw.CameraPosition(
                        new window.vw.CoordZ(127.1235, 37.4850, 1500),
                        new window.vw.Direction(0, -90, 0)
                    ),
                    logo: true,
                };

                const map = new window.vw.Map();
                map.setOption(options);
                map.start();
                setMapObj(map);
                setIsMapLoading(false);
            } catch (err) {
                console.error("Map Init Error:", err);
                setMapError("지도 초기화 중 오류가 발생했습니다.");
                setIsMapLoading(false);
            }
        }

    }, []);

    // Update Map Center when selectedAddress changes
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const movePos = new window.vw.CoordZ(parseFloat(selectedAddress.x), parseFloat(selectedAddress.y), 1000);
                const mPos = new window.vw.CameraPosition(movePos, new window.vw.Direction(0, -90, 0));
                mapObj.moveTo(mPos);
            } catch (e) {
                console.error("Map Move Error:", e);
            }
        }
    }, [mapObj, selectedAddress]);

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group h-full w-full">

            {/* VWorld Map Container */}
            <div id="vworld_map_container" className="w-full h-full absolute inset-0 z-0 bg-gray-200">
                {isMapLoading && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        지도 로딩중...
                    </div>
                )}
                {mapError && (
                    <div className="flex items-center justify-center h-full text-red-500">
                        {mapError}
                    </div>
                )}
            </div>

            {/* Overlays (Keep existing UI on top) */}
            <div className="absolute inset-0 pointer-events-none z-10">
                {markers.map((m) => (
                    <div
                        key={m.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform hover:scale-110"
                        style={{ left: m.x, top: m.y }}
                    >
                        {m.type === 'TARGET' ? (
                            // Target (We now rely on map marker, but can keep this if needed, 
                            // though this overlay is fixed px based which won't sync with map pan.
                            // Hiding this overlay for now as it won't sync with real map)
                            null
                        ) : (
                            // Price Bubble (Static for now, implies need to map to geo-coords later)
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
            <div className="absolute top-4 left-4 flex gap-2 z-20">
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
        </div>
    );
};

export default MapSection;
