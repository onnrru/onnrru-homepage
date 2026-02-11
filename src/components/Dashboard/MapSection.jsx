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

    // Additional WMS Layers Configuration
    const ADDITIONAL_LAYERS = [
        { id: 'LT_C_LANDINFOBASEMAP', label: '지적기반' },
        { id: 'LT_C_UQ111', label: '도시지역' },
        { id: 'LT_C_UQ129', label: '지구단위' },
        { id: 'LT_C_UQ141', label: '정비구역' },
        { id: 'PMAP_PLAN', label: '도시계획' }
    ];

    const [activeLayers, setActiveLayers] = useState([]);

    const toggleLayer = (layerId) => {
        setActiveLayers(prev =>
            prev.includes(layerId)
                ? prev.filter(id => id !== layerId)
                : [...prev, layerId]
        );
    };

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

                const apiKey = 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04';

                // 4. Additional WMS Layers (Including Cadastral Base)
                const extraLayers = ADDITIONAL_LAYERS.map(layer => {
                    const source = new OL.source.TileWMS({
                        url: `${API_CONFIG.VWORLD_BASE_URL}/req/wms`,
                        params: {
                            'LAYERS': layer.id,
                            'STYLES': layer.id,
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

                    const olLayer = new OL.layer.Tile({
                        source: source,
                        visible: false, // Default hidden
                        zIndex: 3, // Above base/satellite
                        opacity: 0.7
                    });
                    olLayer.set('name', layer.id);
                    return olLayer;
                });

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [baseLayer, satelliteLayer, hybridLayer, ...extraLayers],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    }),
                    controls: OL.control.defaults(), // Restore default controls (Zoom, etc.)
                    interactions: OL.interaction.defaults().extend([
                        new OL.interaction.MouseWheelZoom({
                            constrainResolution: true, // Force zooming to integer zoom levels (smoother for tiled maps)
                            duration: 250 // Zoom animation duration
                        })
                    ])
                };

                const map = new OL.Map(mapOptions);
                window.map = map;

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

    // Effect: Handle Map Type Toggle (Satellite vs Base) & Layers
    // We treat 'showHybrid' as the toggle for "Satellite (with Hybrid)" vs "Base (General)"
    // Or we should add a new state for 'mapType'.
    // Current UI has [Satellite (2D)] button. 
    // Let's use 'mapType' state: 'satellite' | 'base'.
    useEffect(() => {
        if (!mapObj) return;
        const layers = mapObj.getLayers();
        layers.forEach(layer => {
            const name = layer.get('name');

            // Base Maps
            if (name === 'satellite') {
                layer.setVisible(mapType === 'satellite');
            }
            if (name === 'base') {
                layer.setVisible(mapType === 'base');
            }
            if (name === 'hybrid') {
                layer.setVisible(mapType === 'satellite' && showHybrid);
            }

            // Additional Layers
            if (ADDITIONAL_LAYERS.some(l => l.id === name)) {
                layer.setVisible(activeLayers.includes(name));
            }
        });
    }, [mapObj, mapType, showHybrid, activeLayers]);

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

            {/* Right Controls (Map Toggles) */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-2 items-end">
                {/* Standard Map Toggles */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHybrid(!showHybrid)}
                        className={`px-3 py-1 text-xs font-bold rounded shadow-md transition-all ${showHybrid ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        명칭표시 (Hybrid)
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

                {/* Additional Layer Toggles (Grouped) */}
                <div className="bg-white/90 p-2 rounded-lg shadow-md flex flex-col gap-1.5 backdrop-blur-sm border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold px-1 mb-0.5">주제도 (Overlay)</span>
                    <div className="grid grid-cols-2 gap-1.5">
                        {ADDITIONAL_LAYERS.map(layer => (
                            <button
                                key={layer.id}
                                onClick={() => toggleLayer(layer.id)}
                                className={`px-2 py-1.5 text-[11px] font-medium rounded border transition-all text-center
                                    ${activeLayers.includes(layer.id)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {layer.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
