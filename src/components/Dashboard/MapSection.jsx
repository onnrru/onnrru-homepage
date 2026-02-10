import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');
    const [mapType, setMapType] = useState('sate');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            // Check for vw.ol3 presence
            if (!window.vw || !window.vw.ol3) {
                retryCount++;
                if (retryCount > maxRetries) {
                    setMapError("VWorld 라이브러리 로드 실패");
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                console.log("Initializing VWorld 2D Map via direct vw.ol3...");

                // We do NOT clear innerHTML here if possible, to avoid React conflicts.
                // But since 'vworld_map_target' is now empty in JSX, we can ensure it's clean.
                const container = document.getElementById("vworld_map_target");
                if (container) {
                    container.innerHTML = '';
                }

                // Default VWorld 2D options
                // REMOVED 'controls' to rely on default behavior or avoid 'defaults is not a function' error
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [
                        new window.vw.ol3.layer.Base(window.vw.ol3.BasemapType.PHOTO)
                    ],
                    view: new window.vw.ol3.View({
                        center: [14151740, 4511257], // Default center
                        zoom: 17,
                    })
                };

                const map = new window.vw.ol3.Map(mapOptions);

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("비상: Direct Init 실패, 상세 에러:", err);
                setMapError("지도 생성 오류: " + err.message);
                setIsMapLoading(false);
            }
        };

        // Start init
        initMap();

        // Cleanup function to avoid memory leaks or double-init if React strictly mounts/unmounts
        return () => {
            // Optional: mapObj could be disposed here if needed, but usually redundant for single-page app life cycle of this component
        };
    }, []);

    // Update Map Center
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                let center = [x, y];
                const proj = window.vw.ol3.proj || (window.ol && window.ol.proj);

                if (proj && x < 180 && y < 90) {
                    center = proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                }

                if (mapObj.getView && typeof mapObj.getView === 'function') {
                    const view = mapObj.getView();
                    view.setCenter(center);
                    view.setZoom(19);
                }

            } catch (e) {
                console.error("Map Move Error:", e);
            }
        }
    }, [mapObj, selectedAddress]);

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group h-full w-full">

            {/* Dedicated Map Container - NO REACT CHILDREN */}
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200"></div>

            {/* UI Overlays (Siblings) */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                {isMapLoading && (
                    <div className="bg-white/80 px-4 py-2 rounded shadow text-gray-700">
                        지도 로딩중...
                    </div>
                )}
                {mapError && (
                    <div className="bg-white/90 px-4 py-2 rounded shadow text-red-600 font-bold">
                        {mapError}
                    </div>
                )}
            </div>

            {/* Controls / Tabs */}
            <div className="absolute top-4 left-4 flex gap-2 z-20 pointer-events-auto">
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
            <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-auto">
                <div className="bg-white rounded-lg shadow-md p-1 flex">
                    <button className="px-3 py-1 text-xs font-bold bg-ink text-white rounded">위성지도 (2D)</button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
