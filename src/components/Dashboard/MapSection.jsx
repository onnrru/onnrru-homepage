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
                // Check if we are in 3D mode (CoordZ available)
                if (window.vw.CoordZ && window.vw.CameraPosition) {
                    // --- 3D Initialization ---
                    console.log("Initializing VWorld 3D Map...");
                    const options = {
                        mapId: "vworld_map_container",
                        initPosition: new window.vw.CameraPosition(
                            new window.vw.CoordZ(127.1235, 37.4850, 1000),
                            new window.vw.Direction(0, -90, 0)
                        ),
                        logo: true,
                        navigation: true
                    };
                    const map = new window.vw.Map();
                    if (typeof map.setOption === 'function') {
                        map.setOption(options);
                    }
                    map.start();
                    setMapObj(map);
                } else if (window.vw.Map) {
                    // --- 2D Initialization (Fallback) ---
                    console.log("Initializing VWorld 2D Map...");
                    // For 2D, pass container ID and options to constructor
                    const options = {
                        controls: [], // Default controls
                        center: [14151740, 4511257], // EPSG:3857 approx for Seoul? Or user-defined
                        zoom: 14
                    };
                    // Use standard VWorld/OL3 wrapper constructor: new vw.Map(containerId, options)
                    const map = new window.vw.Map("vworld_map_container", options);

                    // 2D map usually doesn't need .start() but check
                    if (typeof map.start === 'function') map.start();

                    setMapObj(map);
                }

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
                // Clear existing markers/popups
                if (typeof mapObj.clear === 'function') mapObj.clear();

                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);

                if (window.vw.CoordZ && typeof mapObj.moveTo === 'function') {
                    // 3D Movement
                    const movePos = new window.vw.CoordZ(x, y, 1000);
                    const mPos = new window.vw.CameraPosition(movePos, new window.vw.Direction(0, -90, 0));
                    mapObj.moveTo(mPos);
                } else {
                    // 2D Movement
                    // VWorld 2D often uses EPSG:3857. We might need to transform or use provided API functions.
                    // If mapObj is OpenLayers based:
                    if (typeof mapObj.getView === 'function') {
                        // It's likely an OL3 map object
                        const view = mapObj.getView();
                        // Transform standard coords if needed, or assume VWorld handles it?
                        // VWorld 2.0 uses EPSG:3857 internally usually.
                        // But let's try calling dedicated move function if wrapper exists.
                        // For now, let's try direct view.setCenter if we can transform.
                        // Or blindly use moveTo if it exists.
                        // Safest: Use window.vw.ol3.CameraPosition if available?
                        // Let's rely on basic OL methods if exposed.
                        if (window.ol && window.ol.proj) {
                            const center = window.ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
                            view.setCenter(center);
                            view.setZoom(17);
                        } else {
                            // Try implicit handling
                            // mapObj.getView().setCenter([x, y]);
                            // If 'vw.Coord' exists, maybe use it?
                        }
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
        </div>
    );
};

export default MapSection;
