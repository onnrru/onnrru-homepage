import React, { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

// Full Layer List extracted from User Reference (Exhaustive)
const ALL_LAYERS = [
    // --- Major / Quick Access (Basic) ---
    { id: 'LP_PA_CBND_BUBUN', label: '지적도', category: '기본' },

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
    'LP_PA_CBND_BUBUN', // Cadastral
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
    const [mapType, setMapType] = useState('satellite'); // 'satellite', 'base', 'gray', 'midnight'
    const [activeLayers, setActiveLayers] = useState([]);
    const [showLayerMenu, setShowLayerMenu] = useState(false);

    // Filter
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // Stats
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [markerSource, setMarkerSource] = useState(null);

    // Measurement State
    const [measureMode, setMeasureMode] = useState(null); // 'distance' | 'area' | null
    const [sketch, setSketch] = useState(null);
    const measureTooltipElement = useRef(null);
    const measureTooltip = useRef(null);
    const helpTooltipElement = useRef(null);
    const helpTooltip = useRef(null);
    const measureSource = useRef(null);
    const drawInteraction = useRef(null);

    // [Stabilization] Refs for Cadastral Layer
    const cadastralLayerRef = useRef(null);
    const cadastralPendingRef = useRef(false); // Prevent duplicate moveend/animate triggers

    // [Stabilization] Refs for Data Enrichment
    const enrichLockRef = useRef(false);

    // [Interaction Upgrade] Refs for Event Access
    const activeLayersRef = useRef([]);
    const markerSourceRef = useRef(null);

    useEffect(() => {
        activeLayersRef.current = activeLayers;
    }, [activeLayers]);

    // [Interaction Upgrade] Highlight Helper
    const highlightParcelFeature = (featureData) => {
        const OL = window.ol;
        const markerSrc = markerSourceRef.current;
        if (!markerSrc || !OL) return;

        markerSrc.clear();

        const format = new OL.format.GeoJSON();
        const feature = format.readFeature(featureData, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
        });

        // Red Stroke + Transparent Fill
        feature.setStyle(
            new OL.style.Style({
                stroke: new OL.style.Stroke({ color: '#ef4444', width: 3 }),
                fill: new OL.style.Fill({ color: 'rgba(239, 68, 68, 0.12)' }) // Transparent Red
            })
        );

        markerSrc.addFeature(feature);
    };

    const toggleLayer = (layerId) => {
        // [Stabilization] Auto-zoom logic moved to dedicated useEffect.
        // This function now only toggles state.
        setActiveLayers(prev => {
            const isActive = prev.includes(layerId);
            return isActive
                ? prev.filter(id => id !== layerId)
                : [...prev, layerId];
        });
    };

    // Initialize VWorld Map (OpenLayers)
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
                // USE PROXY PATH (Defined in netlify.toml and api.js)
                // /vworld_map/* -> https://map.vworld.kr/*
                const proxyMapUrl = API_CONFIG.VWORLD_MAP_URL || '/vworld_map';

                // 1. Base Layers
                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
                        attributions: 'VWorld',
                    }),
                    zIndex: 0,
                    visible: false
                });
                baseLayer.set('name', 'base');

                // Gray Layer (White Map - 백지도)
                // Correct URL: use 'white' in path
                const grayLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/white/{z}/{y}/{x}.png`,
                        attributions: 'VWorld',
                    }),
                    zIndex: 0,
                    visible: false
                });
                grayLayer.set('name', 'gray');

                const midnightLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/midnight/{z}/{y}/{x}.png`,
                        attributions: 'VWorld',
                    }),
                    zIndex: 0,
                    visible: false
                });
                midnightLayer.set('name', 'midnight');

                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Satellite/{z}/{y}/{x}.jpeg`,
                        attributions: 'VWorld',
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Hybrid/{z}/{y}/{x}.png`,
                        attributions: 'VWorld',
                    }),
                    zIndex: 10,
                    visible: true
                });
                hybridLayer.set('name', 'hybrid');

                // 2. Cadastral Layer (Final User Standard - ned/wms)
                // Source: ned/wms/CtnlgsSpceService
                // Params: layers='dt_d002' (WMS ID), styles='dt_d002'
                // Internal ID: LP_PA_CBND_BUBUN (Application Consistency)
                const cadastralLayer = new OL.layer.Tile({
                    source: new OL.source.TileWMS({
                        url: 'https://api.vworld.kr/req/wms',
                        params: {
                            service: 'WMS',
                            request: 'GetMap',
                            version: '1.3.0',
                            layers: 'lp_pa_cbnd_bubun',   // ✅ 단일 먼저
                            styles: '',                  // ✅ 반드시 빈값
                            crs: 'EPSG:3857',
                            format: 'image/png',
                            transparent: true,
                            key: apiKey,                 // ✅ 소문자
                            domain: window.location.hostname
                        }
                    }),
                    zIndex: 15,
                    visible: false,
                    minZoom: 14 // 14레벨 유지
                });
                cadastralLayer.set('name', 'LP_PA_CBND_BUBUN');
                cadastralLayerRef.current = cadastralLayer; // [Stabilization] Link Ref

                // 3. WMS Layers (Others)
                const wmsLayers = ALL_LAYERS
                    .filter(l => l.id !== 'LP_PA_CBND_BUBUN')
                    .map(layer => {
                        const source = new OL.source.TileWMS({
                            url: `https://api.vworld.kr/req/wms`, // WMS might need direct or proxy. Browsers usually block mixed content if site is HTTPS.
                            params: {
                                'LAYERS': layer.id.toLowerCase(), // VWorld is case-sensitive often, but usually lowercase is safe for IDs
                                'STYLES': layer.id.toLowerCase(), // Try to match style to layer ID for valid WMS
                                'CRS': 'EPSG:3857',
                                'FORMAT': 'image/png',
                                'TRANSPARENT': 'TRUE',
                                'VERSION': '1.3.0',
                                'key': apiKey,
                                'DOMAIN': window.location.hostname
                            }
                        });

                        const olLayer = new OL.layer.Tile({
                            source: source,
                            visible: false,
                            zIndex: 5,
                            opacity: 0.8
                        });
                        olLayer.set('name', layer.id);
                        return olLayer;
                    });

                // 4. Feature/Marker Layer
                const markerSrc = new OL.source.Vector();
                const markerLayer = new OL.layer.Vector({
                    source: markerSrc,
                    zIndex: 20
                });
                setMarkerSource(markerSrc);
                markerSourceRef.current = markerSrc; // [Interaction Upgrade] Ref Link

                // 5. Measure Layer
                const measureSrc = new OL.source.Vector();
                measureSource.current = measureSrc;
                const measureLayer = new OL.layer.Vector({
                    source: measureSrc,
                    zIndex: 25,
                    style: new OL.style.Style({
                        fill: new OL.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new OL.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        }),
                        image: new OL.style.Circle({
                            radius: 7,
                            fill: new OL.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    })
                });

                // Map Options
                const mapOptions = {
                    target: 'vworld_map_target',
                    layers: [
                        baseLayer, grayLayer, midnightLayer, satelliteLayer,
                        hybridLayer, cadastralLayer, ...wmsLayers,
                        markerLayer, measureLayer
                    ],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    })
                };

                const map = new OL.Map(mapOptions);
                window.map = map;
                setMapObj(map);

                // [Interaction Upgrade] Disable default double click zoom
                map.getInteractions().forEach((i) => {
                    if (i instanceof OL.interaction.DoubleClickZoom) {
                        map.removeInteraction(i);
                    }
                });

                // [Interaction Upgrade] Double Click Handler (Fetch + Zoom + Select)
                map.on('dblclick', async (evt) => {
                    if (measureMode) return;
                    evt.preventDefault?.(); // Prevent potential default behavior

                    const coordinate = evt.coordinate;
                    const [lon, lat] = OL.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        // [Proxy Refinement] Force /api/vworld (Hardcoded for stability)
                        const VWORLD_DATA_BASE = '/api/vworld';
                        const dataUrl = `${VWORLD_DATA_BASE}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun&format=json&geomFilter=POINT(${lon} ${lat})&key=${apiKey}&domain=${window.location.hostname}`;

                        const res = await fetch(dataUrl);
                        const text = await res.text();
                        if (text.trim().startsWith('<')) return; // HTML Error Check

                        const data = JSON.parse(text);
                        if (data?.response?.status !== "OK") return;

                        const featureData = data.response.result.featureCollection.features?.[0];
                        if (!featureData) return;

                        // 1) Highlight
                        highlightParcelFeature(featureData);

                        // 2) Auto Move (Zoom 19)
                        const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                        map.getView().animate({ center: center3857, zoom: 19, duration: 350 });

                        // 3) Fill Info
                        const props = featureData.properties || {};
                        if (onAddressSelect && props.pnu) {
                            onAddressSelect({
                                address: props.addr || "",
                                roadAddr: props.road || props.addr || "",
                                parcelAddr: props.addr || "",
                                x: lon,
                                y: lat,
                                pnu: props.pnu,
                                jimok: props.jimok,
                                area: props.parea,
                                price: props.jiga,
                                zone: props.unm
                            });
                        }
                    } catch (error) {
                        console.error("Map dblclick fetch error:", error);
                    }
                });

                // Click Event Listener (Polygon Highlight & Info)
                map.on('singleclick', async (evt) => {
                    // Ignore if measuring
                    if (measureMode) return;

                    const coordinate = evt.coordinate;
                    const [lon, lat] = OL.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        // [Proxy Refinement] Force /api/vworld (Hardcoded for stability)
                        const VWORLD_DATA_BASE = '/api/vworld';
                        const dataUrl = `${VWORLD_DATA_BASE}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun&format=json&geomFilter=POINT(${lon} ${lat})&key=${apiKey}&domain=${window.location.hostname}`;

                        const res = await fetch(dataUrl);
                        const text = await res.text();

                        if (text.trim().startsWith('<')) {
                            console.error('MapClick: VWorld returned HTML', text.slice(0, 100));
                            return;
                        }

                        const data = JSON.parse(text);

                        if (data.response && data.response.status === "OK") {
                            const featureData = data.response.result.featureCollection.features[0];
                            const props = featureData.properties;

                            // [Interaction Upgrade] Unify Highlight Logic
                            highlightParcelFeature(featureData);

                            if (onAddressSelect && props.pnu) {
                                const newAddress = {
                                    address: props.addr || selectedAddress || "",
                                    roadAddr: props.road || props.addr || "",
                                    parcelAddr: props.addr || "",
                                    x: lon,
                                    y: lat,
                                    pnu: props.pnu,
                                    jimok: props.jimok, // 지목 (예: 대)
                                    area: props.parea,  // 면적 (㎡)
                                    price: props.jiga,  // 개별공시지가 (원/㎡)
                                    zone: props.unm     // 용도지역명
                                };
                                onAddressSelect(newAddress);
                            }
                        }
                    } catch (error) {
                        console.error("Map Click fetch error:", error);
                    }
                });

                setIsMapLoading(false);

            } catch (err) {
                console.error("OpenLayers Init Failed:", err);
                setMapError(`지도 생성 오류: ${err.message}`);
                setIsMapLoading(false);
            }
        };

        initMap();
    }, []);

    // [Stabilization] Dedicated Effect for Cadastral Layer
    useEffect(() => {
        if (!mapObj) return;

        const cadastralLayer = cadastralLayerRef.current;
        if (!cadastralLayer) return;

        const view = mapObj.getView();
        if (!view) return;

        const cadastralOn = activeLayers.includes('LP_PA_CBND_BUBUN');

        // Recommended Zoom Range
        const MIN_Z = 17;
        const MAX_Z = 19;

        // Force Tile Refresh
        const refreshCadastralTiles = () => {
            const src = cadastralLayer.getSource?.();
            if (!src) return;
            if (typeof src.updateParams === 'function') {
                src.updateParams({ _t: Date.now() });
            } else if (typeof src.refresh === 'function') {
                src.refresh();
            } else if (typeof src.changed === 'function') {
                src.changed();
            }
        };

        // OFF: Turn off and reset pending
        if (!cadastralOn) {
            cadastralPendingRef.current = false;
            cadastralLayer.setVisible(false);
            return;
        }

        // ON: If pending, skip
        if (cadastralPendingRef.current) return;

        // Check Zoom
        const zRaw = view.getZoom();
        const z = Number.isFinite(zRaw) ? zRaw : MIN_Z;
        const targetZoom = Math.max(MIN_Z, Math.min(MAX_Z, z));

        // [Interaction Upgrade] Use Range check
        const needZoomMove = (z < MIN_Z) || (z > MAX_Z);

        // Turn off temporarily
        cadastralLayer.setVisible(false);

        const turnOnAfterMove = () => {
            cadastralPendingRef.current = false;
            refreshCadastralTiles();
            cadastralLayer.setVisible(true);
        };

        if (!needZoomMove) {
            refreshCadastralTiles();
            cadastralLayer.setVisible(true);
            return;
        }

        // Move and then Turn On
        cadastralPendingRef.current = true;

        mapObj.once('moveend', () => {
            const stillOn = activeLayers.includes('LP_PA_CBND_BUBUN'); // activeLayers from closure might be stale, need refs if strictly relying on latest state, but dependency array handles it
            if (!stillOn) { // Note: activeLayers is in dependency array, so this effect re-runs on change.
                cadastralPendingRef.current = false;
                cadastralLayer.setVisible(false);
                return;
            }
            turnOnAfterMove();
        });

        view.animate({ zoom: targetZoom, duration: 350 });

    }, [mapObj, activeLayers]); // Re-run when activeLayers changes

    // [Interaction Upgrade] Enforce Cadastral Zoom Lower Bound (>= 17)
    // [Refinement] Use 'moveend' to be smoother than 'change:resolution'
    useEffect(() => {
        if (!mapObj) return;
        const view = mapObj.getView();
        if (!view) return;

        const MIN_Z = 17;

        const onMoveEnd = () => {
            const cadastralOn = activeLayersRef.current.includes('LP_PA_CBND_BUBUN');
            if (!cadastralOn) return;

            const z = view.getZoom();
            if (Number.isFinite(z) && z < MIN_Z) {
                // animate 대신 setZoom이 더 "덜 튐"
                view.setZoom(MIN_Z);
            }
        };

        mapObj.on('moveend', onMoveEnd);
        return () => mapObj.un('moveend', onMoveEnd);
    }, [mapObj]);

    // [Interaction Upgrade] Data Enrichment on Search Selection
    // [Refinement] Fix Infinite Loop & Proxy
    const lastEnrichKeyRef = useRef(null);

    useEffect(() => {
        if (!mapObj || !selectedAddress?.x || !selectedAddress?.y) return;
        if (enrichLockRef.current) return; // Prevent Recursive Loop

        const apiKey = API_CONFIG.VWORLD_KEY;
        // [Proxy Refinement] Force /api/vworld (Hardcoded for stability)
        const VWORLD_DATA_BASE = '/api/vworld';

        const lon = parseFloat(selectedAddress.x);
        const lat = parseFloat(selectedAddress.y);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

        // Prevent duplicate calls
        const key = `${lon},${lat},${selectedAddress.pnu || ''}`;
        if (lastEnrichKeyRef.current === key) return;
        lastEnrichKeyRef.current = key;

        // Check if we already have enough data
        const alreadyEnough =
            !!selectedAddress.pnu &&
            selectedAddress.jimok != null &&
            selectedAddress.area != null &&
            selectedAddress.price != null &&
            selectedAddress.zone != null;

        const run = async () => {
            try {
                const dataUrl =
                    `${VWORLD_DATA_BASE}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun` +
                    `&format=json&geomFilter=POINT(${lon} ${lat})&key=${apiKey}&domain=${window.location.hostname}`;

                const res = await fetch(dataUrl);
                const text = await res.text();

                // Check HTML Response (Error)
                if (text.trim().startsWith('<')) {
                    console.error('VWorld returned HTML. Check proxy/baseURL.', text.slice(0, 120));
                    return;
                }

                const json = JSON.parse(text);
                if (json?.response?.status !== "OK") return;

                const featureData = json.response?.result?.featureCollection?.features?.[0];
                if (!featureData) return;

                // 1) Highlight (Always)
                highlightParcelFeature(featureData);

                // 2) Enrich Address Info (Only if needed)
                if (alreadyEnough) return;

                const props = featureData.properties || {};
                const enriched = {
                    ...selectedAddress,
                    address: props.addr || selectedAddress.address || "",
                    roadAddr: props.road || selectedAddress.roadAddr || props.addr || "",
                    parcelAddr: props.addr || selectedAddress.parcelAddr || "",
                    pnu: props.pnu || selectedAddress.pnu,
                    jimok: props.jimok ?? selectedAddress.jimok,
                    area: props.parea ?? selectedAddress.area,
                    price: props.jiga ?? selectedAddress.price,
                    zone: props.unm ?? selectedAddress.zone
                };

                const changed =
                    enriched.pnu !== selectedAddress.pnu ||
                    enriched.jimok !== selectedAddress.jimok ||
                    enriched.area !== selectedAddress.area ||
                    enriched.price !== selectedAddress.price ||
                    enriched.zone !== selectedAddress.zone;

                if (changed && onAddressSelect && enriched.pnu) {
                    enrichLockRef.current = true;
                    onAddressSelect(enriched);
                    // Unlock next cycle
                    setTimeout(() => { enrichLockRef.current = false; }, 0);
                }
            } catch (e) {
                console.error("SelectedAddress enrich failed:", e);
            }
        };

        run();
    }, [mapObj, selectedAddress]);

    // Effect: Handle Layer Visibility (Generic Checks)
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

            // WMTS Cadastral [REMOVED] - Handled by Dedicated Effect above
            // if (name === 'LP_PA_CBND_BUBUN') {
            //     layer.setVisible(activeLayers.includes('LP_PA_CBND_BUBUN'));
            // }

            // WMS Layers
            if (ALL_LAYERS.some(l => l.id === name && l.id !== 'LP_PA_CBND_BUBUN')) {
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

                const view = mapObj.getView();
                if (view) {
                    view.animate({ center: center, duration: 500, zoom: 19 });
                }
            } catch (e) {
                console.error("Map Update Error:", e);
            }
        }
    }, [mapObj, selectedAddress]);

    // Categories for Filter
    const categories = ['전체', ...new Set(ALL_LAYERS.filter(l => !['LP_PA_CBND_BUBUN', ...QUICK_LAYER_IDS].includes(l.id)).map(l => l.category))];

    // Basic Exposed Layers (Quick Access)
    const BASIC_LAYERS = [
        'LT_C_UQ111', // Urban
        'LT_C_UQ112', // Management
        'LT_C_UQ113', // Agriculture
        'LT_C_UQ114'  // Nature Preservation
    ];

    // --- Measurement Logic ---
    useEffect(() => {
        if (!mapObj || !measureMode) {
            // Cleanup interaction if mode is off
            if (mapObj && drawInteraction.current) {
                mapObj.removeInteraction(drawInteraction.current);
                drawInteraction.current = null;
            }
            if (mapObj && helpTooltipElement.current) {
                mapObj.removeOverlay(helpTooltip.current);
            }
            return;
        }

        const OL = window.ol;
        const source = measureSource.current;

        // Add Draw Interaction
        const type = measureMode === 'area' ? 'Polygon' : 'LineString';
        const draw = new OL.interaction.Draw({
            source: source,
            type: type,
            style: new OL.style.Style({
                fill: new OL.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new OL.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new OL.style.Circle({
                    radius: 5,
                    stroke: new OL.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new OL.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });

        // Overlay Logic
        const createMeasureTooltip = () => {
            if (measureTooltipElement.current) {
                measureTooltipElement.current.parentNode.removeChild(measureTooltipElement.current);
            }
            measureTooltipElement.current = document.createElement('div');
            measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-measure bg-black/70 text-white px-2 py-1 rounded text-xs';
            measureTooltip.current = new OL.Overlay({
                element: measureTooltipElement.current,
                offset: [0, -15],
                positioning: 'bottom-center',
                stopEvent: false,
                insertFirst: false
            });
            mapObj.addOverlay(measureTooltip.current);
        };

        const createHelpTooltip = () => {
            if (helpTooltipElement.current) {
                helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
            }
            helpTooltipElement.current = document.createElement('div');
            helpTooltipElement.current.className = 'ol-tooltip hidden';
            helpTooltip.current = new OL.Overlay({
                element: helpTooltipElement.current,
                offset: [15, 0],
                positioning: 'center-left'
            });
            mapObj.addOverlay(helpTooltip.current);
        };

        createMeasureTooltip();
        createHelpTooltip();

        let listener;
        draw.on('drawstart', (evt) => {
            setSketch(evt.feature);
            let tooltipCoord = evt.coordinate;

            listener = evt.feature.getGeometry().on('change', (evt) => {
                const geom = evt.target;
                let output;
                if (geom instanceof OL.geom.Polygon) {
                    const area = OL.sphere.getArea(geom);
                    output = area > 10000
                        ? (Math.round(area / 1000000 * 100) / 100) + ' km²'
                        : (Math.round(area * 100) / 100) + ' m²';
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof OL.geom.LineString) {
                    const length = OL.sphere.getLength(geom);
                    output = length > 1000
                        ? (Math.round(length / 1000 * 100) / 100) + ' km'
                        : (Math.round(length * 100) / 100) + ' m';
                    tooltipCoord = geom.getLastCoordinate();
                }
                measureTooltipElement.current.innerHTML = output;
                measureTooltip.current.setPosition(tooltipCoord);
            });
        });

        draw.on('drawend', () => {
            measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-static bg-black/70 text-white px-2 py-1 rounded text-xs border border-white/20 shadow-sm';
            measureTooltip.current.setOffset([0, -7]);
            setSketch(null);
            measureTooltipElement.current = null;
            createMeasureTooltip();
            OL.Observable.unByKey(listener);
        });

        mapObj.addInteraction(draw);
        drawInteraction.current = draw;

        return () => {
            mapObj.removeInteraction(draw);
        };
    }, [mapObj, measureMode]);

    const clearMeasurements = () => {
        if (measureSource.current) {
            measureSource.current.clear();
        }
        const staticTooltips = document.querySelectorAll('.ol-tooltip-static');
        staticTooltips.forEach(el => el.remove());
        setMeasureMode(null);
    };

    return (
        <div className={`flex-1 relative bg-gray-100 overflow-hidden group h-full w-full ${measureMode ? 'cursor-crosshair' : ''}`}>
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200 outline-none" tabIndex="0"></div>

            {/* Error/Loading */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                {isMapLoading && <div className="bg-white/90 px-4 py-2 rounded shadow text-gray-800 font-medium">지도 데이터를 불러오는 중...</div>}
                {mapError && <div className="bg-white/90 px-4 py-2 rounded shadow text-red-600 font-bold">{mapError}</div>}
            </div>

            {/* Measurement Tools (Left Vertical) */}
            {/* Measurement Tools (Left Vertical) */}
            <div className="absolute top-[80px] left-4 z-20 flex flex-col gap-2 p-1 pointer-events-auto">

                {/* Distance */}
                <button
                    onClick={() => setMeasureMode(measureMode === 'distance' ? null : 'distance')}
                    className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg shadow-md border transition-all duration-200
                        ${measureMode === 'distance'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white border-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    title="거리 재기"
                >
                    <svg className="w-5 h-5 mb-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m1-4V5m6 14v-2a2 2 0 00-2-2h-1a2 2 0 00-2 2v2m-2-4h.01M17 16h.01"></path></svg>
                    <span className="text-[9px] font-bold leading-none">거리</span>
                </button>

                {/* Area */}
                <button
                    onClick={() => setMeasureMode(measureMode === 'area' ? null : 'area')}
                    className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg shadow-md border transition-all duration-200
                        ${measureMode === 'area'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white border-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                    title="면적 재기"
                >
                    <svg className="w-5 h-5 mb-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span className="text-[9px] font-bold leading-none">면적</span>
                </button>

                {/* Clear */}
                <button
                    onClick={clearMeasurements}
                    className="flex flex-col items-center justify-center w-11 h-11 rounded-lg shadow-md border border-white bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all duration-200"
                    title="초기화"
                >
                    <svg className="w-5 h-5 mb-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span className="text-[9px] font-bold leading-none">지우기</span>
                </button>
            </div>

            {/* Main Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-2 items-end">

                {/* 1. Map Types + Hybrid Group */}
                <div className="flex gap-2 h-[34px]">
                    <div className="bg-white rounded shadow-sm p-1 flex items-center border border-gray-200 h-full">
                        {[
                            { id: 'base', label: '일반지도' },
                            { id: 'gray', label: '백지도' },
                            { id: 'midnight', label: '야간' },
                            { id: 'satellite', label: '위성지도' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setMapType(type.id)}
                                className={`px-3 h-full text-xs font-bold rounded transition-colors
                                    ${mapType === type.id
                                        ? 'bg-gray-800 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                {type.label}
                            </button>
                        ))}

                        <button
                            onClick={() => setShowHybrid(!showHybrid)}
                            className={`px-3 h-full text-xs font-bold rounded transition-colors
                                ${showHybrid
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                            명칭
                        </button>
                    </div>

                    {/* Cadastral Map (WMTS) */}
                    <button
                        onClick={() => toggleLayer('LP_PA_CBND_BUBUN')}
                        className={`px-3 text-xs font-bold rounded shadow-sm border transition-all h-full
                            ${activeLayers.includes('LP_PA_CBND_BUBUN')
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        지적도
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
                {activeLayers.filter(id => !BASIC_LAYERS.includes(id) && id !== 'LP_PA_CBND_BUBUN').length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end max-w-[400px]">
                        {activeLayers.filter(id => !BASIC_LAYERS.includes(id) && id !== 'LP_PA_CBND_BUBUN').map(id => {
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

                        // Handle Cadastral and others with no good legend
                        if (id === 'LP_PA_CBND_BUBUN') return null;

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
                                        src={`https://api.vworld.kr/req/image?service=image&request=GetLegendGraphic&format=png&type=ALL&layer=${layer.id.toUpperCase()}&style=${layer.id.toUpperCase()}&key=${API_CONFIG.VWORLD_KEY}`}
                                        alt="범례"
                                        className="max-w-full h-auto object-contain min-h-[20px]"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<span class="text-[10px] text-gray-400">범례 없음</span>';
                                        }}
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
                                const categoryLayers = ALL_LAYERS.filter(l => l.category === category && !['LP_PA_CBND_BUBUN', ...BASIC_LAYERS].includes(l.id));
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
