import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');

    // Default to 'sate' (Satellite) as user requested 'Like the screenshot'
    const [mapType, setMapType] = useState('sate');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map using Standard vw.ol3 Direct Initialization
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            // Check for vw.ol3 presence (confirmed existing by debug)
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

                // Clear container just in case
                const container = document.getElementById("vworld_map_container");
                if (container) container.innerHTML = '';

                const mapOptions = {
                    target: 'vworld_map_container',
                    controls: window.vw.ol3.control.defaults().extend([
                        new window.vw.ol3.control.Zoom(),
                        new window.vw.ol3.control.ScaleLine(),
                    ]),
                    layers: [
                        new window.vw.ol3.layer.Base(window.vw.ol3.BasemapType.PHOTO) // Satellite
                    ],
                    view: new window.vw.ol3.View({
                        center: [14151740, 4511257], // Default center (approx)
                        zoom: 17,
                        // VWorld 2D defaults to EPSG:3857, usually auto-handled by vw.ol3.View defaults
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

        initMap();
    }, []);

    // Update Map Center when selectedAddress changes
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                // Check if we need to transform coordinates
                // VWorld Geocoder usually returns EPSG:4326 (Lon/Lat)
                // OpenLayers View usually expects EPSG:3857

                let center = [x, y];

                // If window.ol.proj exists (it should via vw.ol3), use it
                // Note: window.vw.ol3 might alias window.ol, or be separate. 
                // We should check window.vw.ol3.proj too.
                const proj = window.vw.ol3.proj || (window.ol && window.ol.proj);

                if (proj) {
                    // Start with basic 4326 check
                    if (x < 180 && y < 90) { // Rough check for Lon/Lat
                        center = proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                    }
                }

                if (mapObj.getView && typeof mapObj.getView === 'function') {
                    const view = mapObj.getView();
                    view.setCenter(center);
                    view.setZoom(19); // Close zoom for detail
                }

                // Add Marker? 
                // Standard OL3 marker code involves Layers/Features.
                // Keeping it simple first: just move center.

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
                    <button className="px-3 py-1 text-xs font-bold bg-ink text-white rounded">위성지도 (2D)</button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
