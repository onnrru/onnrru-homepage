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
                // Poll for VWorld 3D classes availability
                const checkVWorld = () => {
                    // Check for 'vw' namespace AND 'CoordZ' (3D) AND 'Map'
                    if (window.vw && window.vw.CoordZ && window.vw.Map) {
                        initMap();
                    } else {
                        setTimeout(checkVWorld, 500);
                    }
                };
                checkVWorld();
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
            // Script exists, check if ready
            const checkVWorld = () => {
                if (window.vw && window.vw.CoordZ && window.vw.Map) {
                    initMap();
                } else {
                    setTimeout(checkVWorld, 500);
                }
            };
            checkVWorld();
        }

        function initMap() {
            if (mapObj) return;

            // Strict check for CoordZ (3D support)
            if (!window.vw || !window.vw.CoordZ) {
                // Should be handled by polling, but guard just in case
                return;
            }

            try {
                // User snippet pattern:
                // let options = { ... initPosition: new vw.CameraPosition(...) ... }
                // let map = new vw.Map(); map.setOption(options); map.start();

                const options = {
                    mapId: "vworld_map_container",
                    initPosition: new window.vw.CameraPosition(
                        new window.vw.CoordZ(127.1235, 37.4850, 1000),
                        new window.vw.Direction(0, -90, 0)
                    ),
                    logo: true,
                    navigation: true // Added per snippet
                };

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

    // Update Map Center & Add Marker when selectedAddress changes
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                // Clear existing markers/popups
                mapObj.clear();

                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);
                const z = 200; // Altitude for marker

                // Move Camera
                if (window.vw && window.vw.CoordZ) {
                    const movePos = new window.vw.CoordZ(x, y, 1000);
                    const mPos = new window.vw.CameraPosition(movePos, new window.vw.Direction(0, -90, 0));
                    mapObj.moveTo(mPos);

                    // Create Marker (Point)
                    // Reference: pt = new vw.geom.Point(new vw.Coord(mx,my));
                    // User snippet used Coord for Point, but CoordZ for Camera. 
                    // Let's use CoordZ if in 3D mode.
                    const pt = new window.vw.geom.Point(new window.vw.CoordZ(x, y, z));
                    pt.setImage("https://map.vworld.kr/images/op02/map_point.png");
                    pt.setName(selectedAddress.address);
                    pt.setFont("Pretendard");
                    pt.setFontSize(14);

                    // Event Handler for Popup
                    const eventHandler = function (windowPosition, ecefPosition, cartographic, featureInfo) {
                        // Create Title & HTML content
                        const title = selectedAddress.address;
                        const html = `
                            <div style="padding:5px; font-size:12px; line-height:1.5;">
                                <div style="font-weight:bold; color:#000;">${selectedAddress.roadAddr || selectedAddress.address}</div>
                                <div style="color:#666;">${selectedAddress.parcelAddr || ''}</div>
                            </div>
                        `;

                        // vw.Popup(id, container, title, html, width, height, x, y)
                        // Note: x, y here are screen coordinates (windowPosition)
                        const pop = new window.vw.Popup("address_popup", "vworld_map_container", title, html, 250, 100, windowPosition.x, windowPosition.y);
                        pop.create();
                    };

                    pt.addEventListener(eventHandler);
                    pt.create();
                }

            } catch (e) {
                console.error("Map Marker Error:", e);
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
