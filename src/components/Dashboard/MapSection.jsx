import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');
    const [mapType, setMapType] = useState('sate');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [debugInfo, setDebugInfo] = useState("Initializing...");

    // Initialize VWorld Map using pure OpenLayers global (ol)
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            // Debug usage of globals
            const ol = window.ol;
            const vw = window.vw;
            const status = `Globals: ol=${!!ol}, vw=${!!vw}, vw.ol3=${!!(vw && vw.ol3)}`;
            console.log(status);
            setDebugInfo(status);

            // Check if global 'ol' is available. 
            // VWorld 2.0 init script "usually" loads 'ol' globally. 
            // If not, we might need to rely on 'vw.ol3' carefully, provided we find where 'source' is.
            if (!ol && (!vw || !vw.ol3)) {
                retryCount++;
                if (retryCount > maxRetries) {
                    setMapError("지도 엔진(OpenLayers)을 찾을 수 없습니다.");
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                console.log("Initializing VWorld 2D Map via global 'ol'...");

                // Ensure container is clean
                const container = document.getElementById("vworld_map_target");
                if (container) {
                    container.innerHTML = '';
                }

                // Determine correct namespaces
                // Use 'ol' global if available (Standard OpenLayers)
                // Fallback to 'vw.ol3' if 'ol' is missing (VWorld wrapper)
                // The previous error showed vw.ol3.source is undefined, so 'ol' is our best bet.
                const OL = ol || window.vw.ol3;

                // Defensive check for required classes
                if (!OL || !OL.Map || !OL.View || !OL.layer || !OL.source) {
                    // If vw.ol3 exists but lacks source (as seen), we can't use it easily.
                    // We throw to catch block.
                    if (!OL.source) throw new Error("OpenLayers 'source' namespace is missing.");
                }

                // URL for VWorld Satellite Tiles
                // Note: Using HTTPS to match site protocol
                const vworldSatelliteUrl = 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg';

                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [
                        new OL.layer.Tile({
                            source: new OL.source.XYZ({
                                url: vworldSatelliteUrl,
                                attributions: 'VWorld',
                                crossOrigin: 'anonymous' // Good practice for tiles
                            })
                        })
                    ],
                    view: new OL.View({
                        center: [14151740, 4511257], // Default center
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                        // Note: If using pure OL, default projection is Web Mercator (EPSG:3857), which matches VWorld tiles.
                    }),
                    controls: [], // Start without controls to avoid errors
                };

                // Create Map
                const map = new OL.Map(mapOptions);

                // Add Zoom control if available
                if (OL.control && OL.control.Zoom) {
                    map.addControl(new OL.control.Zoom());
                }

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("비상: Direct Init 실패, 상세 에러:", err);
                setMapError(`지도 생성 오류: ${err.message} (ol=${!!window.ol})`);
                setIsMapLoading(false);
            }
        };

        // Start init
        initMap();

        return () => {
            // Cleanup
        };
    }, []);

    // Update Map Center
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                let center = [x, y];

                // Use explicit 'ol.proj' if available, or try to find it on namespace
                const ol = window.ol || window.vw?.ol3;
                const proj = ol?.proj;

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

            {/* Dedicated Map Container */}
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200"></div>

            {/* UI Overlays */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                {isMapLoading && (
                    <div className="flex flex-col items-center justify-center bg-white/80 px-4 py-2 rounded shadow text-gray-700 gap-1">
                        <span>지도 로딩중...</span>
                        <span className="text-[10px] text-gray-500 font-mono">{debugInfo}</span>
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
