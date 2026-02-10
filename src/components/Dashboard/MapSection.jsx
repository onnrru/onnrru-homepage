import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');

    // Toggles
    const [showCadastral, setShowCadastral] = useState(false);
    const [showHybrid, setShowHybrid] = useState(false);
    const [mapType, setMapType] = useState('satellite'); // 'satellite' or 'base'

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

                // 1. Base Layer (Graphic/White)
                const vworldBaseUrl = 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png';
                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldBaseUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0,
                    visible: false // Default hidden (Satellite is default)
                });
                baseLayer.set('name', 'base');

                // 2. Satellite Layer (Background)
                const vworldSatelliteUrl = 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg';
                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldSatelliteUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                // 3. Hybrid Layer (Labels) - Context for Satellite
                const vworldHybridUrl = 'https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{y}.png';
                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldHybridUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 1,
                    visible: true // Default visible with Satellite
                });
                hybridLayer.set('name', 'hybrid');

                // 4. Cadastral (Jijeokdo) Layer - WMTS
                // Using Proxy to avoid CORS Issues with VWorld API
                const apiKey = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';

                // Using WMS for Cadastral might be safer if WMTS XYZ path is tricky? 
                // Let's stick to WMS as user snippet suggested WMS `addWMSLayer`.
                const wmsSource = new OL.source.TileWMS({
                    url: `${API_CONFIG.VWORLD_BASE_URL}/req/wms`, // Use Proxy: /api/vworld/req/wms
                    params: {
                        'LAYERS': 'lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun',
                        'STYLES': 'lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun',
                        'CRS': 'EPSG:3857',
                        'TILED': true,
                        'FORMAT': 'image/png',
                        'VERSION': '1.3.0',
                        'KEY': apiKey,
                        'DOMAIN': 'onnrru.com'
                    },
                    serverType: 'geoserver',
                    crossOrigin: 'anonymous'
                });

                const cadastralLayer = new OL.layer.Tile({
                    source: wmsSource,
                    visible: false,
                    zIndex: 2,
                    opacity: 0.8
                });
                cadastralLayer.set('name', 'cadastral');

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [baseLayer, satelliteLayer, hybridLayer, cadastralLayer],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    }),
                    controls: [],
                    interactions: OL.interaction.defaults({
                        mouseWheelZoom: true,
                        dragPan: true
                    })
                };

                const map = new OL.Map(mapOptions);
                window.map = map; // Expose for debugging/user snippet compatibility

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

    // Effect: Handle Map Type Toggle (Satellite vs Base)
    // We treat 'showHybrid' as the toggle for "Satellite (with Hybrid)" vs "Base (General)"
    // Or we should add a new state for 'mapType'.
    // Current UI has [Satellite (2D)] button. 
    // Let's use 'mapType' state: 'satellite' | 'base'.
    useEffect(() => {
        if (!mapObj) return;
        const layers = mapObj.getLayers();
        layers.forEach(layer => {
            const name = layer.get('name');
            if (name === 'satellite') {
                layer.setVisible(mapType === 'satellite');
            }
            if (name === 'base') {
                layer.setVisible(mapType === 'base');
            }
            // Hybrid logic linked to Satellite usually, or Independent?
            if (name === 'hybrid') {
                layer.setVisible(mapType === 'satellite' && showHybrid);
                // If Base map, usually Hybrid is not needed (Base has labels). 
                // But let's allow "Info" toggle to control it on Satellite.
            }
            if (name === 'cadastral') {
                layer.setVisible(showCadastral);
            }
        });
    }, [mapObj, mapType, showCadastral, showHybrid]);

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
        if (view) view.setZoom(view.getZoom() + 1);
    };

    const handleZoomOut = () => {
        if (!mapObj) return;
        const view = mapObj.getView();
        if (view) view.setZoom(view.getZoom() - 1);
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
                    <button
                        onClick={() => setMapType(mapType === 'satellite' ? 'base' : 'satellite')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mapType === 'satellite' ? 'bg-white text-gray-800' : 'bg-ink text-white'}`}
                    >
                        {mapType === 'satellite' ? '일반지도' : '위성지도 (2D)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
