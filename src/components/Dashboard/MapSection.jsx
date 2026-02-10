import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MapSection = ({ selectedAddress }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);
    const [activeTab, setActiveTab] = useState('real');
    const [showCadastral, setShowCadastral] = useState(false);
    const [showHybrid, setShowHybrid] = useState(false); // Default: Satellite Only

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Initialize VWorld Map using pure OpenLayers global (ol)
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

                // 1. Satellite Layer (Background)
                const vworldSatelliteUrl = 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg';
                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldSatelliteUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 0
                });

                // 2. Hybrid Layer (Labels/Roads) - Toggleable
                const vworldHybridUrl = 'https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{y}.png';
                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: vworldHybridUrl,
                        attributions: 'VWorld',
                        crossOrigin: 'anonymous'
                    }),
                    zIndex: 1,
                    visible: false // Initially hidden
                });
                hybridLayer.set('name', 'hybrid');

                // 3. Cadastral (Jijeokdo) Layer - WMS Overlay
                const wmsSource = new OL.source.TileWMS({
                    url: 'https://api.vworld.kr/req/wms',
                    params: {
                        'LAYERS': 'lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun',
                        'STYLES': 'lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun',
                        'CRS': 'EPSG:3857',
                        'TILED': true,
                        'FORMAT': 'image/png',
                        'VERSION': '1.3.0',
                        'KEY': 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04',
                        'DOMAIN': 'onnrru.com'
                    },
                    serverType: 'geoserver',
                    crossOrigin: 'anonymous'
                });
                const cadastralLayer = new OL.layer.Tile({
                    source: wmsSource,
                    visible: false, // Initially hidden
                    zIndex: 2,
                    opacity: 0.7
                });
                cadastralLayer.set('name', 'cadastral');

                // Define Interactions Manually (Force Enable)
                // We avoid .defaults() as it might be broken in VWorld's build
                const interactions = [];
                if (OL.interaction) {
                    if (OL.interaction.DragPan) interactions.push(new OL.interaction.DragPan());
                    if (OL.interaction.MouseWheelZoom) interactions.push(new OL.interaction.MouseWheelZoom({
                        constrainResolution: true // Snap to zoom levels
                    }));
                    if (OL.interaction.DoubleClickZoom) interactions.push(new OL.interaction.DoubleClickZoom());
                }

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [satelliteLayer, hybridLayer, cadastralLayer],
                    view: new OL.View({
                        center: [14151740, 4511257], // Default center
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    }),
                    controls: [],
                    interactions: interactions // Use manual interactions
                };

                const map = new OL.Map(mapOptions);

                // Add Zoom Control for UI
                if (OL.control && OL.control.Zoom) {
                    map.addControl(new OL.control.Zoom());
                }

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("비상: Direct Init 실패, 상세 에러:", err);
                setMapError(`지도 생성 오류: ${err.message}`);
                setIsMapLoading(false);
            }
        };

        initMap();

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Toggle Layer Visibility
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

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group h-full w-full">

            {/* Dedicated Map Container */}
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200"></div>

            {/* UI Overlays */}
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

            {/* Map Type & Jijeokdo Toggle */}
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
