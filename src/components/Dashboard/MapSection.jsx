import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

// Full Layer List extracted from User Reference (Exhaustive)
const ALL_LAYERS = [
    // --- Major / Quick Access (Basic) ---
    { id: 'lp_pa_cb_nd_bu', label: '지적도', category: '기본' },

    // --- Zoning Areas (용도지역) ---
    { id: 'LT_C_UQ111', label: '도시지역', category: '용도지역' },
    { id: 'LT_C_UQ112', label: '관리지역', category: '용도지역' },
    { id: 'LT_C_UQ113', label: '농림지역', category: '용도지역' },
    { id: 'LT_C_UQ114', label: '자연환경보전지역', category: '용도지역' },

    // --- Zoning Districts (용도지구) ---
    { id: 'LT_C_UQ129', label: '개발진흥지구', category: '용도지구' },
    { id: 'LT_C_UQ121', label: '경관지구', category: '용도지구' },
    { id: 'LT_C_UQ123', label: '고도지구', category: '용도지구' },
    { id: 'LT_C_UQ122', label: '미관지구', category: '용도지구' },
    { id: 'LT_C_UQ125', label: '방재지구', category: '용도지구' },
    { id: 'LT_C_UQ124', label: '방화지구', category: '용도지구' },
    { id: 'LT_C_UQ126', label: '보존지구', category: '용도지구' },
    { id: 'LT_C_UQ127', label: '시설보호지구', category: '용도지구' },
    { id: 'LT_C_UQ128', label: '취락지구', category: '용도지구' },
    { id: 'LT_C_UQ130', label: '특정용도제한지구', category: '용도지구' },

    // --- Zoning Zones (용도구역) ---
    { id: 'LT_C_UD801', label: '개발제한구역', category: '용도구역' },
    { id: 'LT_C_UQ141', label: '국토계획구역', category: '용도구역' },
    { id: 'LT_C_UQ162', label: '도시자연공원구역', category: '용도구역' },
    { id: 'LT_C_UM000', label: '가축사육제한구역', category: '용도구역' },
    { id: 'LT_C_UO601', label: '관광지', category: '용도구역' },
    { id: 'LT_C_UD610', label: '국민임대주택', category: '용도구역' },
    { id: 'LT_C_UP401', label: '급경사재해예방지역', category: '용도구역' },
    { id: 'LT_C_UM301', label: '대기환경규제지역', category: '용도구역' },
    { id: 'LT_C_UF901', label: '백두대간보호지역', category: '용도구역' },
    { id: 'LT_C_UH701', label: '벤처기업육성지역', category: '용도구역' },
    { id: 'LT_C_UD620', label: '보금자리주택', category: '용도구역' },
    { id: 'LT_C_UF151', label: '산림보호구역', category: '용도구역' },
    { id: 'LT_C_UM901', label: '습지보호지역', category: '용도구역' },
    { id: 'LT_C_UB901', label: '시장정비구역', category: '용도구역' },
    { id: 'LT_C_UM221', label: '야생동식물보호', category: '용도구역' },
    { id: 'LT_C_UJ401', label: '온천지구', category: '용도구역' },
    { id: 'LT_C_UH501', label: '유통단지', category: '용도구역' },
    { id: 'LT_C_UH402', label: '자유무역지역', category: '용도구역' },
    { id: 'LT_C_UD601', label: '주거환경개선지구도', category: '용도구역' },
    { id: 'LT_C_UO101', label: '학교환경위생정화구역', category: '용도구역' },

    // --- Urban Planning & Infrastructure (도시계획/기반시설) ---
    { id: 'LT_C_LHZONE', label: '사업지구경계도', category: '도시계획' },
    { id: 'LT_C_LHBLPN', label: '토지이용계획도(LH)', category: '도시계획' },
    { id: 'LT_C_UPISUQ153', label: '도시계획(공간시설)', category: '도시계획' },
    { id: 'LT_C_UPISUQ155', label: '도시계획(공공문화)', category: '도시계획' },
    { id: 'LT_C_UPISUQ152', label: '도시계획(교통시설)', category: '도시계획' },
    { id: 'LT_C_UPISUQ159', label: '도시계획(기타)', category: '도시계획' },
    { id: 'LT_C_UPISUQ151', label: '도시계획(도로)', category: '도시계획' },
    { id: 'LT_C_UPISUQ156', label: '도시계획(방재시설)', category: '도시계획' },
    { id: 'LT_C_UPISUQ157', label: '도시계획(보건위생)', category: '도시계획' },
    { id: 'LT_C_UPISUQ154', label: '도시계획(유통공급)', category: '도시계획' },
    { id: 'LT_C_UPISUQ158', label: '도시계획(환경기초)', category: '도시계획' },
    { id: 'LT_C_UPISUQ161', label: '지구단위계획', category: '도시계획' },
    { id: 'LT_C_UPISUQ171', label: '개발행위허가제한', category: '도시계획' },
    { id: 'LT_C_UPISUQ174', label: '개발행위허가필지', category: '도시계획' },
    { id: 'LT_C_UPISUQ173', label: '기반시설부담구역', category: '도시계획' },
    { id: 'LT_C_UPISUQ175', label: '토지거래허가구역', category: '도시계획' },

    // --- Environment & Forest (환경/산림) ---
    { id: 'LT_C_KFDRSSIGUGRADE', label: '산불위험예측지도', category: '환경/산림' },
    { id: 'LT_C_AGRIXUE101', label: '농업진흥지역도', category: '환경/산림' },
    { id: 'LT_C_AGRIXUE102', label: '영농여건불리농지', category: '환경/산림' },
    { id: 'LT_C_FLISFK300', label: '산지(보안림)', category: '환경/산림' },
    { id: 'LT_C_FLISFK100', label: '산지(자연휴양림)', category: '환경/산림' },
    { id: 'LT_C_FLISFK200', label: '산지(채종림)', category: '환경/산림' },
    { id: 'LT_C_UF602', label: '임업및산촌진흥권역', category: '환경/산림' },
    { id: 'LT_C_FSDIFRSTS', label: '산림입지도', category: '환경/산림' },

    // --- Disaster & Safety (재해/안전) ---
    { id: 'LT_C_UP201', label: '재해위험지구', category: '재해/안전' },
    { id: 'LT_P_EDRSE002', label: '지진대피소', category: '재해/안전' },
    { id: 'LT_P_ETQSHELTER', label: '지진해일대피소', category: '재해/안전' },
    { id: 'LT_C_USFSFFB', label: '소방서관할구역', category: '재해/안전' },
    { id: 'LT_C_CDFRS100FRQ', label: '해안침수(100년)', category: '재해/안전' },
    { id: 'LT_C_CDFRSMAXFRQ', label: '해안침수(최대범람)', category: '재해/안전' },

    // --- Maritime & Water (수자원/해양) ---
    { id: 'LT_C_WGISPLTALK', label: '개발유도연안', category: '수자원/해양' },
    { id: 'LT_C_WGISPLROW', label: '개발조정연안', category: '수자원/해양' },
    { id: 'LT_C_WGISPLUSE', label: '이용연안', category: '수자원/해양' },
    { id: 'LT_C_WGISPLABS', label: '절대보전연안', category: '수자원/해양' },
    { id: 'LT_C_WGISPLJUN', label: '준보전연안', category: '수자원/해양' },
    { id: 'LT_C_WKMSBSN', label: '표준권역(수자원)', category: '수자원/해양' },
    { id: 'LT_C_WKMSTRM', label: '하천망', category: '수자원/해양' },
    { id: 'LT_C_UM710', label: '상수원보호', category: '수자원/해양' },
    { id: 'LT_C_WGISARFISHER', label: '수산자원보호구역', category: '수자원/해양' },
    { id: 'LT_C_WGISARWET', label: '습지보호구역', category: '수자원/해양' },
    { id: 'LT_L_TOISDEPCNTAH', label: '해안선', category: '수자원/해양' },

    // --- Administrative & Etc (행정/기타) ---
    { id: 'LT_C_ADSIDO', label: '광역시도', category: '행정/기타' },
    { id: 'LT_C_ADSIGG', label: '시군구', category: '행정/기타' },
    { id: 'LT_C_ADEMD', label: '읍면동', category: '행정/기타' },
    { id: 'LT_C_RI', label: '리', category: '행정/기타' },
    { id: 'LT_L_SPRD', label: '도로명주소도로', category: '행정/기타' },
    { id: 'LT_C_SPBD', label: '도로명주소건물', category: '행정/기타' },
    { id: 'LT_P_NSNMSSITENM', label: '국가지명', category: '행정/기타' }
];

// Top 6 Quick Access Layers
const QUICK_LAYER_IDS = [
    'lp_pa_cb_nd_bu', // Cadastral
    'LT_C_UQ111',     // Urban Area
    'LT_C_UQ112',     // Management Area
    'LT_C_UQ113',     // Agriculture Area
    'LT_C_UQ114',     // Nature Preservation
    'LT_C_UD801'      // Green Belt
];

const MapSection = ({ selectedAddress, onAddressSelect }) => {
    const mapRef = useRef(null);
    const [mapObj, setMapObj] = useState(null);

    // Toggles
    const [showHybrid, setShowHybrid] = useState(false);
    const [mapType, setMapType] = useState('satellite'); // 'satellite' or 'base'
    const [activeLayers, setActiveLayers] = useState([]);
    const [showLayerMenu, setShowLayerMenu] = useState(false);

    // UI Logic
    const [selectedCategory, setSelectedCategory] = useState('전체');

    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [markerSource, setMarkerSource] = useState(null);

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

            if (!window.ol) {
                retryCount++;
                if (retryCount > maxRetries) {
                    setMapError("OpenLayers 로드 실패");
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                const OL = window.ol;
                const container = document.getElementById("vworld_map_target");
                if (container) container.innerHTML = '';
                if (container) {
                    container.tabIndex = 0;
                    container.focus();
                }

                const apiKey = API_CONFIG.VWORLD_KEY;

                // 1. Base Layer
                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png`,
                        attributions: 'VWorld',
                        // crossOrigin: 'anonymous' // Removed to avoid CORS issues
                    }),
                    zIndex: 0,
                    visible: false
                });
                baseLayer.set('name', 'base');

                // 2. Gray Layer (2D백지도)
                const grayLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/gray/service/{z}/{x}/{y}.png`,
                        attributions: 'VWorld',
                        // crossOrigin: 'anonymous' // Removed to avoid CORS issues
                    }),
                    zIndex: 0,
                    visible: false
                });
                grayLayer.set('name', 'gray');

                // 3. Midnight Layer (2D야간)
                const midnightLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/midnight/service/{z}/{x}/{y}.png`,
                        attributions: 'VWorld',
                        // crossOrigin: 'anonymous' // Removed to avoid CORS issues
                    }),
                    zIndex: 0,
                    visible: false
                });
                midnightLayer.set('name', 'midnight');

                // 4. Satellite Layer
                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg`,
                        attributions: 'VWorld',
                        // crossOrigin: 'anonymous' // Removed to avoid CORS issues
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                // 5. Hybrid Layer
                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{y}.png`,
                        attributions: 'VWorld',
                        // crossOrigin: 'anonymous' // Removed to avoid CORS issues
                    }),
                    zIndex: 10, // Above everything
                    visible: true
                });
                hybridLayer.set('name', 'hybrid');

                // 4. All WMS Layers (Standardized)
                const wmsLayers = ALL_LAYERS.map(layer => {
                    const source = new OL.source.TileWMS({
                        url: `https://api.vworld.kr/req/wms`,
                        params: {
                            'LAYERS': layer.id.toLowerCase(),
                            'STYLES': '',
                            'CRS': 'EPSG:3857',
                            'FORMAT': 'image/png',
                            'TRANSPARENT': 'TRUE',
                            'VERSION': '1.3.0',
                            'key': API_CONFIG.VWORLD_KEY,
                            'DOMAIN': window.location.hostname
                        },
                        // serverType: 'geoserver'  // Removed as suggested
                        // crossOrigin: 'anonymous' // REMOVED: Causing CORS errors on production domain
                    });

                    // Error Handling
                    source.on('tileloaderror', (event) => {
                        // Log the actual URL that failed to help debugging
                        const tileUrl = event.tile ? event.tile.src_ : 'unknown';
                        console.warn(`Layer Load Warning: ${layer.label} (${layer.id})`, tileUrl);
                    });

                    const olLayer = new OL.layer.Tile({
                        source: source,
                        visible: false,
                        zIndex: layer.id === 'lp_pa_cb_nd_bu' ? 8 : 5, // Cadastral above zoning (5), below Hybrid (10)
                        opacity: 0.8
                    });
                    olLayer.set('name', layer.id);
                    return olLayer;
                });

                // 5. Marker/Vector Layer (Topmost of content)
                const markerSrc = new OL.source.Vector();
                const markerLayer = new OL.layer.Vector({
                    source: markerSrc,
                    zIndex: 20
                });
                setMarkerSource(markerSrc);

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [baseLayer, grayLayer, midnightLayer, satelliteLayer, hybridLayer, ...wmsLayers, markerLayer],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    })
                };

                const map = new OL.Map(mapOptions);
                window.map = map;

                // Click Event Listener
                map.on('singleclick', async (evt) => {
                    const coordinate = evt.coordinate;
                    const [lon, lat] = OL.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const dataUrl = `${API_CONFIG.VWORLD_BASE_URL}/req/data?service=data&request=GetFeature&data=LP_PA_CBND_BUBUN&geomFilter=POINT(${lon} ${lat})&key=${apiKey}&domain=${window.location.hostname}`;
                        const response = await fetch(dataUrl);
                        const data = await response.json();

                        if (data.response && data.response.status === "OK") {
                            const featureData = data.response.result.featureCollection.features[0];
                            const props = featureData.properties;

                            // Highlight Boundary (Polygon) + Marker
                            if (markerSrc) {
                                markerSrc.clear();
                                const format = new OL.format.GeoJSON();
                                const feature = format.readFeature(featureData, {
                                    featureProjection: 'EPSG:3857',
                                    dataProjection: 'EPSG:4326'
                                });
                                const polygonStyle = new OL.style.Style({
                                    stroke: new OL.style.Stroke({ color: '#ef4444', width: 3 }),
                                    fill: new OL.style.Fill({ color: 'rgba(239, 68, 68, 0.1)' })
                                });
                                feature.setStyle(polygonStyle);
                                markerSrc.addFeature(feature);

                                const markerFeature = new OL.Feature({
                                    geometry: new OL.geom.Point(coordinate)
                                });
                                const markerStyle = new OL.style.Style({
                                    image: new OL.style.Icon({
                                        anchor: [0.5, 1],
                                        src: 'https://map.vworld.kr/images/ol3/marker_blue.png',
                                        scale: 0.8
                                    })
                                });
                                markerFeature.setStyle(markerStyle);
                                markerSrc.addFeature(markerFeature);
                            }

                            if (onAddressSelect && props.pnu) {
                                const newAddress = {
                                    address: props.addr || "",
                                    roadAddr: props.addr || "",
                                    parcelAddr: props.addr || "",
                                    x: lon,
                                    y: lat,
                                    pnu: props.pnu,
                                    price: props.jiga,
                                    area: props.parea,
                                    jimok: props.jimok
                                };
                                onAddressSelect(newAddress);
                            }
                        }
                    } catch (error) {
                        console.error("Map Click fetch error:", error);
                    }
                });

                setMapObj(map);
                setIsMapLoading(false);

            } catch (err) {
                console.error("OpenLayers Init Failed:", err);
                setMapError(`지도 생성 오류: ${err.message}`);
                setIsMapLoading(false);
            }
        };

        initMap();
    }, []);

    // Effect: Handle Layer Visibility & Map Type
    useEffect(() => {
        if (!mapObj) return;
        const layers = mapObj.getLayers();
        layers.forEach(layer => {
            const name = layer.get('name');

            if (name === 'satellite') layer.setVisible(mapType === 'satellite');
            if (name === 'base') layer.setVisible(mapType === 'base');
            if (name === 'gray') layer.setVisible(mapType === 'gray');
            if (name === 'midnight') layer.setVisible(mapType === 'midnight');
            if (name === 'hybrid') layer.setVisible(mapType === 'satellite' && showHybrid);

            // WMS Layers
            if (ALL_LAYERS.some(l => l.id === name)) {
                layer.setVisible(activeLayers.includes(name));
            }
        });
    }, [mapObj, mapType, showHybrid, activeLayers]);

    // Update Map Center
    useEffect(() => {
        if (mapObj && selectedAddress && selectedAddress.x && selectedAddress.y) {
            try {
                const ol = window.ol;
                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);
                const center = ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');

                if (markerSource) {
                    markerSource.clear();
                    const feature = new ol.Feature({ geometry: new ol.geom.Point(center) });
                    const iconStyle = new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.5, 1],
                            src: 'https://map.vworld.kr/images/ol3/marker_blue.png',
                            scale: 0.8
                        })
                    });
                    feature.setStyle(iconStyle);
                    markerSource.addFeature(feature);
                }

                const view = mapObj.getView();
                if (view) {
                    view.animate({ center: center, duration: 500, zoom: 19 });
                }
            } catch (e) {
                console.error("Map Update Error:", e);
            }
        }
    }, [mapObj, selectedAddress, markerSource]);

    // Categories for Filter
    const categories = ['전체', ...new Set(ALL_LAYERS.filter(l => !['lp_pa_cb_nd_bu', 'LT_C_UQ111', 'LT_C_UQ112', 'LT_C_UQ113', 'LT_C_UQ114'].includes(l.id)).map(l => l.category))];

    // Basic Exposed Layers (Quick Access)
    const BASIC_LAYERS = [
        'LT_C_UQ111', // Urban
        'LT_C_UQ112', // Management
        'LT_C_UQ113', // Agriculture
        'LT_C_UQ114'  // Nature Preservation
    ];

    return (
        <div className="flex-1 relative bg-gray-100 overflow-hidden group h-full w-full">
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200 outline-none" tabIndex="0"></div>

            {/* Error/Loading */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                {isMapLoading && <div className="bg-white/90 px-4 py-2 rounded shadow text-gray-800 font-medium">지도 데이터를 불러오는 중...</div>}
                {mapError && <div className="bg-white/90 px-4 py-2 rounded shadow text-red-600 font-bold">{mapError}</div>}
            </div>

            {/* Main Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-2 items-end">

                {/* 1. Map Types + Cadastral (Top Row) */}
                <div className="flex gap-2">
                    <div className="bg-white rounded shadow-sm p-1 flex border border-gray-200">
                        {[
                            { id: 'base', label: '2D지도' },
                            { id: 'gray', label: '2D백지도' },
                            { id: 'midnight', label: '2D야간' },
                            { id: 'satellite', label: '2D영상' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setMapType(type.id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors
                                    ${mapType === type.id
                                        ? 'bg-gray-800 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Cadastral Map (Separate but same line) */}
                    <button
                        onClick={() => toggleLayer('lp_pa_cb_nd_bu')}
                        className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm border transition-all
                            ${activeLayers.includes('lp_pa_cb_nd_bu')
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        지적도
                    </button>

                    {/* Hybrid Toggle (Overlay for Satellite/Etc) */}
                    <button
                        onClick={() => setShowHybrid(!showHybrid)}
                        className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-all border
                            ${showHybrid ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        명칭
                    </button>
                </div>

                {/* 2. Basic Exposed Layers (Zoning) */}
                <div className="bg-white/95 p-2 rounded-lg shadow-lg border border-gray-100 backdrop-blur-sm flex gap-2">
                    {BASIC_LAYERS.map(id => {
                        const layer = ALL_LAYERS.find(l => l.id === id);
                        if (!layer) return null;
                        const isActive = activeLayers.includes(id);
                        return (
                            <button
                                key={id}
                                onClick={() => toggleLayer(id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded border transition-all
                                    ${isActive
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {layer.label}
                            </button>
                        );
                    })}
                </div>

                {/* 3. Active "Other" Layers (Dynamic Chips) */}
                {activeLayers.filter(id => !BASIC_LAYERS.includes(id) && id !== 'lp_pa_cb_nd_bu').length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end max-w-[400px]">
                        {activeLayers.filter(id => !BASIC_LAYERS.includes(id) && id !== 'lp_pa_cb_nd_bu').map(id => {
                            const layer = ALL_LAYERS.find(l => l.id === id);
                            if (!layer) return null;
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleLayer(id)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 flex items-center gap-1 shadow-sm"
                                >
                                    <span>{layer.label}</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 4. More Layers Button */}
                <button
                    onClick={() => setShowLayerMenu(true)}
                    className="px-4 py-2 text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    <span>전체 레이어</span>
                </button>
            </div>

            {/* ... Legends ... */}
            {activeLayers.length > 0 && (
                <div className="absolute bottom-6 left-6 z-20 pointer-events-auto max-w-[300px] flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                    {activeLayers.map(id => {
                        const layer = ALL_LAYERS.find(l => l.id === id);
                        if (!layer) return null;
                        return (
                            <div key={id} className="bg-white/95 p-2 rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm animate-slide-up">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold text-gray-800">{layer.label}</span>
                                    <button onClick={() => toggleLayer(id)} className="text-gray-400 hover:text-red-500">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="bg-gray-50 rounded p-1 flex justify-center">
                                    <img
                                        src={`https://api.vworld.kr/req/image?key=${API_CONFIG.VWORLD_KEY}&service=image&request=GetLegendGraphic&format=png&type=ALL&layer=${layer.id}`}
                                        alt="범례"
                                        className="max-w-full h-auto object-contain min-h-[20px]"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ... Full Layer Modal ... */}
            {showLayerMenu && (
                <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex justify-end" onClick={() => setShowLayerMenu(false)}>
                    <div
                        className="w-[320px] h-full bg-white shadow-2xl flex flex-col animate-slide-left pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-sm">전체 레이어 목록</h3>
                            <button onClick={() => setShowLayerMenu(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="p-2 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors
                                        ${selectedCategory === cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-6">
                            {['용도지역', '용도지구', '용도구역', '도시계획', '환경/산림', '재해/안전', '수자원/해양', '행정/기타'].map(category => {
                                if (selectedCategory !== '전체' && selectedCategory !== category) return null;
                                // Filter out BASIC LAYERS and Cadastral Map from the list if desired, OR keep them but mark as active.
                                // User said "Basic exposure... and others are as is".
                                // Let's show ALL layers in the list for completeness, but maybe group them?
                                // Actually, Quick Layers were filtered out in previous logic. Let's filter out Basic here too if we want them exclusive, 
                                // BUT usually "Full Layer List" means FULL.
                                // Let's use the same filter logic as before but updated for BASIC_LAYERS.
                                const categoryLayers = ALL_LAYERS.filter(l => l.category === category && !['lp_pa_cb_nd_bu', ...BASIC_LAYERS].includes(l.id));
                                if (categoryLayers.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h4 className="text-[11px] font-bold text-gray-400 mb-2 border-b border-gray-100 pb-1 sticky top-0 bg-white/95 backdrop-blur z-10">
                                            {category}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoryLayers.map(layer => {
                                                const isActive = activeLayers.includes(layer.id);
                                                return (
                                                    <button
                                                        key={layer.id}
                                                        onClick={() => toggleLayer(layer.id)}
                                                        className={`px-2 py-2 text-[11px] font-medium rounded border transition-all text-left flex items-center justify-between group
                                                            ${isActive
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200'
                                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <span className="truncate">{layer.label}</span>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapSection;
