import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');

    // Default to 'base' for stability as requested in debug step
    const [mapType, setMapType] = useState('base');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [debugInfo, setDebugInfo] = useState("Initializing...");

    // Initialize VWorld Map using vw.ol3.MapUtil.create2DMap
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20; // 10 seconds

        const initMap = () => {
            if (mapObj) return;

            // Debug status for user visibility
            const vwExists = !!window.vw;
            const ol3Exists = !!(window.vw && window.vw.ol3);
            const utilExists = !!(window.vw && window.vw.ol3 && window.vw.ol3.MapUtil);

            const status = `Check ${retryCount}: vw=${vwExists}, ol3=${ol3Exists}, MapUtil=${utilExists}`;
            console.log(status);
            setDebugInfo(status);

            // Check if vw.ol3.MapUtil exists
            if (!utilExists) {
                retryCount++;
                if (retryCount > maxRetries) {
                    console.error("Map Load Timeout");
                    setMapError("지도 라이브러리 로드 실패 (Timeout). 새로고침 해주세요.");
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                console.log("Initializing VWorld 2D Map via MapUtil...");

                const mapDivId = "vworld_map_container";
                const mapStyle = "base";
                const layerTitle = "부동산 분석 지도";
                const tilt = 0;
                const key = "F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04";

                // Execute user's requested function
                window.vw.ol3.MapUtil.create2DMap(mapDivId, mapStyle, layerTitle, tilt, key);

                // Allow some time for the map to render into the DOM
                setTimeout(() => {
                    // Start checking for the map object to enable movement
                    if (window.vmap) {
                        setMapObj(window.vmap);
                    } else {
                        // Fallback: If vmap global isn't set, we assume it loaded visually but we can't control it easily.
                        // We mark initialization as done so the loading spinner goes away.
                        console.warn("window.vmap not found, but create2DMap executed.");
                        setMapObj({ initialized: true });
                    }
                    setIsMapLoading(false);
                }, 1000);

            } catch (err) {
                console.error("지도 로딩 중 오류 발생:", err);
                setMapError("지도 초기화 오류: " + err.message);
                setIsMapLoading(false);
            }
        };

        initMap();
    }, []);

    // Update Map Center when selectedAddress changes
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                // Movement Logic
                if (mapObj.getView && typeof mapObj.getView === 'function') {
                    const view = mapObj.getView();
                    if (window.ol && window.ol.proj) {
                        const center = window.ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                        view.setCenter(center);
                        view.setZoom(17);
                    }
                } else if (window.vmap && window.vmap.getView) {
                    const view = window.vmap.getView();
                    if (window.ol && window.ol.proj) {
                        const center = window.ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                        view.setCenter(center);
                        view.setZoom(17);
                    }
                }

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
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <span>지도 로딩중...</span>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{debugInfo}</span>
                    </div>
                )}
                {mapError && (
                    <div className="flex items-center justify-center h-full text-red-500 font-bold">
                        {mapError}
                    </div>
                )}
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

            {/* Map Type Indicator */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                <div className="bg-white rounded-lg shadow-md p-1 flex">
                    <button className="px-3 py-1 text-xs font-bold bg-ink text-white rounded">기본지도 (2D)</button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
