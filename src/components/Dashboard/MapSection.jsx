import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');

    // Toggles
    const [showCadastral, setShowCadastral] = useState(false);
    const [showHybrid, setShowHybrid] = useState(false);

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            const ol = window.ol;
            const vw = window.vw;

            if (!ol && (!vw || !vw.ol3)) {
                retryCount++;
                if (retryCount > maxRetries) {
                    setMapError("지도 엔진 로드 실패");
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                const OL = ol || window.vw.ol3;
                if (!OL || !OL.Map || !OL.View || !OL.layer || !OL.source) {
                    if (!OL.source) throw new Error("OpenLayers source namespace missing");
                }

                // Clear container
                const container = document.getElementById("vworld_map_target");
                if (container) container.innerHTML = '';

                // Force focus
                container.tabIndex = 0;
                container.focus();

                // 1. Satellite Layer
                const vworldSatelliteUrl = 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg';
                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldSatelliteUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0
                });

                // 2. Hybrid Layer (Labels) - Toggleable
                const vworldHybridUrl = 'https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{y}.png';
                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldHybridUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 1,
                    visible: false
                });
                hybridLayer.set('name', 'hybrid');

                // 3. Cadastral (Jijeokdo) Layer - WMTS XYZ
                // Using VWorld 2.0 XYZ service for continuous cadastral map
                // URL Pattern: https://api.vworld.kr/req/wmts/1.0.0/{key}/{layer}/{z}/{y}/{x}.png
                const apiKey = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';
                const cadastralUrl = `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/lp_pa_cbnd_bubun/{z}/{y}/{x}.png`;

                const cadastralLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: cadastralUrl,
                        crossOrigin: 'anonymous'
                    }),
                    visible: false,
                    zIndex: 2,
                    opacity: 0.8
                });
                cadastralLayer.set('name', 'cadastral');

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [satelliteLayer, hybridLayer, cadastralLayer],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    }),
                    controls: [],
                    // Explicitly enable defaults including MouseWheel
                    interactions: OL.interaction.defaults({
                        mouseWheelZoom: true,
                        dragPan: true,
                        doubleClickZoom: true
                    })
                };

                const map = new OL.Map(mapOptions);

                // Additional check for MouseWheelZoom via manual add if needed
                // Usually defaults() covers it. But let's add interaction explicitly if it feels unresponsive.
                // We'll trust defaults() first as it handles platform quirks better.

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("비상: Direct Init 실패, 상세 에러:", err);
                setMapError(`지도 생성 오류: ${err.message}`);
                setIsMapLoading(false);
            }
        };

        initMap();
    }, []);

    // Toggle Visibility
    useEffect(() => {
        if (!mapObj) return;
        const layers = mapObj.getLayers();
        layers.forEach(layer => {
            if (layer.get('name') === 'cadastral') {
                layer.setVisible(showCadastral);
            }
            if (layer.get('name') === 'hybrid') {
                layer.setVisible(showHybrid);
            }
        });
    }, [mapObj, showCadastral, showHybrid]);

    // Update Map Center
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);
                let center = [x, y];
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

    // Custom Zoom Handlers
    const handleZoomIn = () => {
        if (!mapObj) return;
        const view = mapObj.getView();
        view.setZoom(view.getZoom() + 1);
    };

    const handleZoomOut = () => {
        if (!mapObj) return;
        const view = mapObj.getView();
        view.setZoom(view.getZoom() - 1);
    };

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group h-full w-full">

            {/* Dedicated Map Container */}
            <div
                id="vworld_map_target"
                className="w-full h-full absolute inset-0 z-0 bg-gray-200 outline-none"
                tabIndex="0"
            ></div>

            {/* Loading/Error Overlays */}
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

            {/* Left Controls (Analysis Tabs) */}
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

            {/* Custom Zoom Controls (Left Middle) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 pointer-events-auto">
                <button
                    onClick={handleZoomIn}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 font-bold text-xl border border-gray-200"
                    aria-label="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 font-bold text-xl border border-gray-200"
                    aria-label="Zoom Out"
                >
                    -
                </button>
            </div>

            {/* Right Controls (Map Toggles) */}
            <div className="absolute top-4 right-4 flex gap-2 z-20 pointer-events-auto">
                <button
                    onClick={() => setShowCadastral(!showCadastral)}
                    className={`px-3 py-1 text-xs font-bold rounded shadow-md transition-all ${showCadastral ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    지적도
                </button>
                <button
                    onClick={() => setShowHybrid(!showHybrid)}
                    className={`px-3 py-1 text-xs font-bold rounded shadow-md transition-all ${showHybrid ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                    정보보기
                </button>
                <div className="bg-white rounded-lg shadow-md p-1 flex">
                    <button className="px-3 py-1 text-xs font-bold bg-ink text-white rounded">위성지도 (2D)</button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
