import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real'); // 'real' or 'eum'
    const [mapType, setMapType] = useState('2D'); // '2D' (Satellite)

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map
    useEffect(() => {
        // Poll for VWorld classes - Global script loaded in index.html
        const checkVWorld = () => {
            if (window.vw && window.vw.Map) {
                initMap();
            } else {
                setTimeout(checkVWorld, 500);
            }
        };
        checkVWorld();

        function initMap() {
            if (mapObj) return;
            if (!window.vw) return;

            try {
                // Initialize as 2D Satellite (Per user request)
                console.log("Initializing VWorld 2D Satellite Map...");

                const options = {
                    container: "vworld_map_container",
                    mapId: "vworld_map_container",
                    controls: [],
                    zoom: 17,
                    initPosition: new window.vw.CameraPosition(
                        new window.vw.Coord(127.1235, 37.4850), // Default center
                        new window.vw.Direction(0, -90, 0)
                    ),
                    logo: true,
                    navigation: true,
                    basemapType: window.vw.ol3.BasemapType.PHOTO, // Satellite Base
                };

                // Create Map
                const map = new window.vw.Map();
                map.setOption(options);
                map.start();

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("Map Init Error:", err);
                setMapError(`지도 초기화 오류: ${err.message || err}`);
                setIsMapLoading(false);
            }
        }
    }, []);

    // Update Map Center when selectedAddress changes
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                if (typeof mapObj.clear === 'function') mapObj.clear();

                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                // 2D Movement
                if (window.vw.Coord) {
                    const movePos = new window.vw.Coord(x, y);
                    const mPos = new window.vw.CameraPosition(movePos, new window.vw.Direction(0, -90, 0));
                    mapObj.moveTo(mPos);
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
