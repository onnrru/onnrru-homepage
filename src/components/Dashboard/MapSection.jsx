import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');

    // Default to 'sate' (Satellite) as per previous context, though user snippet had 'base'.
    // User requested "Like this map" (Satellite) previously. 
    // Allowing toggle effectively requires clearing/re-init if using this specific utility, or access to map layer.
    const [mapType, setMapType] = useState('sate');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map using vw.ol3.MapUtil.create2DMap
    useEffect(() => {
        const initMap = () => {
            if (mapObj) return;
            // Check if vw.ol3.MapUtil exists (loaded by global script)
            if (!window.vw || !window.vw.ol3 || !window.vw.ol3.MapUtil) {
                // Poll/Retry if not ready
                setTimeout(initMap, 500);
                return;
            }

            try {
                console.log("Initializing VWorld 2D Map via MapUtil...");

                // User provided code structure:
                const mapDivId = "vworld_map_container";
                // Using 'sate' (Satellite) instead of 'base' to match visual requirements, 
                // but following the requested function call structure.
                const mapStyle = "sate";
                const layerTitle = "부동산 분석 지도";
                const tilt = 0;
                const key = "F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04";

                // Execute user's requested function
                // Note: create2DMap might not return the map object directly. 
                // We need to capture it to support movement.
                // Usually VWorld 2.0 assigns the map using the mapUtil.
                // We will try to capture the return value just in case.
                const mapInstance = window.vw.ol3.MapUtil.create2DMap(mapDivId, mapStyle, layerTitle, tilt, key);

                // Use the returned instance if available, otherwise check standard global locations
                // or just mark loading as done.
                if (mapInstance) {
                    setMapObj(mapInstance);
                } else if (window.vmap) {
                    setMapObj(window.vmap);
                } else {
                    // Fallback: If we can't find the object, we can't move it programmatically easily.
                    // But at least it initializes.
                    // We'll trust that create2DMap works.
                    // To enable movement, we might need to find the OpenLayers map attached to the div.
                    // Let's postpone movement logic fix until we see init work.
                    setMapObj({ initialized: true });
                }

                setIsMapLoading(false);

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
                // If mapObj is a real OL map instance
                if (mapObj.getView && typeof mapObj.getView === 'function') {
                    const view = mapObj.getView();
                    // VWorld 2D usually uses EPSG:3857 (Web Mercator)
                    // We need to transform EPSG:4326 (Lon/Lat) to EPSG:3857 if needed.
                    // Assuming input is Lon/Lat (127..., 37...).
                    if (window.ol && window.ol.proj) {
                        const center = window.ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                        view.setCenter(center);
                        view.setZoom(17);
                        console.log("Moved map to:", x, y);
                    }
                } else {
                    console.warn("Map object not capable of movement or not found.");
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
                    <button className="px-3 py-1 text-xs font-bold bg-ink text-white rounded">위성지도 (2D)</button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
