import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../../config/api';

// Full Layer List extracted from User Reference (Exhaustive)
const ALL_LAYERS = [
    { id: 'LP_PA_CBND_BUBUN', label: '지적도', category: '기본' },

    { id: 'LT_C_UQ111', label: '도시지역', category: '용도지역' },
    { id: 'LT_C_UQ112', label: '관리지역', category: '용도지역' },
    { id: 'LT_C_UQ113', label: '농림지역', category: '용도지역' },
    { id: 'LT_C_UQ114', label: '자연환경보전지역', category: '용도지역' },

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

    { id: 'LT_C_KFDRSSIGUGRADE', label: '산불위험예측지도', category: '환경/산림' },
    { id: 'LT_C_AGRIXUE101', label: '농업진흥지역도', category: '환경/산림' },
    { id: 'LT_C_AGRIXUE102', label: '영농여건불리농지', category: '환경/산림' },
    { id: 'LT_C_FLISFK300', label: '산지(보안림)', category: '환경/산림' },
    { id: 'LT_C_FLISFK100', label: '산지(자연휴양림)', category: '환경/산림' },
    { id: 'LT_C_FLISFK200', label: '산지(채종림)', category: '환경/산림' },
    { id: 'LT_C_UF602', label: '임업및산촌진흥권역', category: '환경/산림' },
    { id: 'LT_C_FSDIFRSTS', label: '산림입지도', category: '환경/산림' },

    { id: 'LT_C_UP201', label: '재해위험지구', category: '재해/안전' },
    { id: 'LT_P_EDRSE002', label: '지진대피소', category: '재해/안전' },
    { id: 'LT_P_ETQSHELTER', label: '지진해일대피소', category: '재해/안전' },
    { id: 'LT_C_USFSFFB', label: '소방서관할구역', category: '재해/안전' },
    { id: 'LT_C_CDFRS100FRQ', label: '해안침수(100년)', category: '재해/안전' },
    { id: 'LT_C_CDFRSMAXFRQ', label: '해안침수(최대범람)', category: '재해/안전' },

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

    { id: 'LT_C_ADSIDO', label: '광역시도', category: '행정/기타' },
    { id: 'LT_C_ADSIGG', label: '시군구', category: '행정/기타' },
    { id: 'LT_C_ADEMD', label: '읍면동', category: '행정/기타' },
    { id: 'LT_C_RI', label: '리', category: '행정/기타' },
    { id: 'LT_L_SPRD', label: '도로명주소도로', category: '행정/기타' },
    { id: 'LT_C_SPBD', label: '도로명주소건물', category: '행정/기타' },
    { id: 'LT_P_NSNMSSITENM', label: '국가지명', category: '행정/기타' }
];

const QUICK_LAYER_IDS = [
    'LP_PA_CBND_BUBUN',
    'LT_C_UQ111',
    'LT_C_UQ112',
    'LT_C_UQ113',
    'LT_C_UQ114',
    'LT_C_UD801'
];

const BASIC_LAYERS = ['LT_C_UQ111', 'LT_C_UQ112', 'LT_C_UQ113', 'LT_C_UQ114'];

const MapSection = ({
    selectedAddress,
    onAddressSelect,
    selectedParcels = [],
    onParcelsChange,
    analyzedApartments = []
}) => {
    const [mapObj, setMapObj] = useState(null);

    // Toggles
    const [showHybrid, setShowHybrid] = useState(false);
    const [mapType, setMapType] = useState('satellite');
    const [activeLayers, setActiveLayers] = useState([]);
    const [showLayerMenu, setShowLayerMenu] = useState(false);

    // Sub-menu Toggles for Map Types and Zones
    const [showMapTypes, setShowMapTypes] = useState(false);
    const [showZones, setShowZones] = useState(false);

    // Filter
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // Stats
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Measurement State
    const [measureMode, setMeasureMode] = useState(null); // 'distance' | 'area' | null
    const measureModeRef = useRef(null);
    useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);

    // Parcel Select Mode (지번추가)
    const [parcelPickMode, setParcelPickMode] = useState(false);
    const parcelPickModeRef = useRef(false);
    useEffect(() => { parcelPickModeRef.current = parcelPickMode; }, [parcelPickMode]);

    const measureTooltipElement = useRef(null);
    const measureTooltip = useRef(null);
    const helpTooltipElement = useRef(null);
    const helpTooltip = useRef(null);
    const measureSource = useRef(null);
    const drawInteraction = useRef(null);

    // Cadastral stabilization
    const cadastralLayerRef = useRef(null);
    const cadastralPendingRef = useRef(false);

    // Data enrichment lock
    const enrichLockRef = useRef(false);
    const lastEnrichKeyRef = useRef(null);

    // Refs
    const activeLayersRef = useRef([]);
    useEffect(() => { activeLayersRef.current = activeLayers; }, [activeLayers]);

    const markerSourceRef = useRef(null);     // 단일 포커스(검색/더블클릭 등)
    const selectionSourceRef = useRef(null);  // 멀티 선택(Shift 누적)
    const aptMarkerSourceRef = useRef(null);  // 아파트 분석 마커

    const getPnu = (fd) => fd?.properties?.pnu;

    const toggleLayer = (layerId) => {
        setActiveLayers((prev) => {
            const isActive = prev.includes(layerId);
            return isActive ? prev.filter((id) => id !== layerId) : [...prev, layerId];
        });
    };

    // ====== Fetcher (Proxy path) ======
    const fetchParcelByLonLat = useCallback(async (lon, lat, apiKey) => {
        const base = '/api/vworld';
        const url =
            `${base}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun` +
            `&format=json&geomFilter=POINT(${lon} ${lat})&key=${apiKey}&domain=${window.location.hostname}`;

        const res = await fetch(url);
        const text = await res.text();

        if (text.trim().startsWith('<')) {
            console.error('VWorld returned HTML (proxy issue):', text.slice(0, 120));
            return null;
        }

        const json = JSON.parse(text);
        if (json?.response?.status !== 'OK') return null;

        return json.response?.result?.featureCollection?.features?.[0] || null;
    }, []);

    // ====== Renderers ======
    const renderSingleFocus = useCallback((featureData) => {
        const OL = window.ol;
        const src = markerSourceRef.current;
        if (!OL || !src || !featureData) return;

        src.clear();
        const format = new OL.format.GeoJSON();
        const f = format.readFeature(featureData, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
        });

        f.setStyle(
            new OL.style.Style({
                stroke: new OL.style.Stroke({ color: '#ef4444', width: 3 }),
                fill: new OL.style.Fill({ color: 'rgba(239, 68, 68, 0.12)' })
            })
        );

        src.addFeature(f);
    }, []);

    const renderSelectedParcels = useCallback((featuresDataList) => {
        const OL = window.ol;
        const src = selectionSourceRef.current;
        if (!OL || !src) return;

        src.clear();

        const format = new OL.format.GeoJSON();
        (featuresDataList || []).forEach((fd) => {
            if (!fd) return;
            const f = format.readFeature(fd, {
                featureProjection: 'EPSG:3857',
                dataProjection: 'EPSG:4326'
            });

            f.setStyle(
                new OL.style.Style({
                    stroke: new OL.style.Stroke({ color: '#ef4444', width: 3 }),
                    fill: new OL.style.Fill({ color: 'rgba(239, 68, 68, 0.12)' })
                })
            );

            src.addFeature(f);
        });
    }, []);

    // 부모 상태 업데이트(중요: prev=> 형태 금지)
    const commitSelectedParcels = useCallback((nextList) => {
        const safe = Array.isArray(nextList) ? nextList : [];
        onParcelsChange?.(safe);
        renderSelectedParcels(safe);
    }, [onParcelsChange, renderSelectedParcels]);

    // props selectedParcels 변경 시 지도에도 반영
    const selectedParcelsRef = useRef(selectedParcels);
    useEffect(() => {
        selectedParcelsRef.current = selectedParcels;
        if (!mapObj) return;
        renderSelectedParcels(selectedParcels);
    }, [mapObj, selectedParcels, renderSelectedParcels]);

    // ====== Init Map ======
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            if (!window.ol) {
                retryCount++;
                if (retryCount > maxRetries) {
                    setMapError('OpenLayers 로드 실패');
                    setIsMapLoading(false);
                    return;
                }
                setTimeout(initMap, 500);
                return;
            }

            try {
                const OL = window.ol;
                const container = document.getElementById('vworld_map_target');
                if (container) container.innerHTML = '';

                const apiKey = API_CONFIG.VWORLD_KEY;
                const proxyMapUrl = API_CONFIG.VWORLD_MAP_URL || '/vworld_map';

                // Base layers
                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                baseLayer.set('name', 'base');

                const grayLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/white/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                grayLayer.set('name', 'gray');

                const midnightLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/midnight/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                midnightLayer.set('name', 'midnight');

                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Satellite/{z}/{y}/{x}.jpeg`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/req/wmts/1.0.0/${apiKey}/Hybrid/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 10,
                    visible: true
                });
                hybridLayer.set('name', 'hybrid');

                // Cadastral (WMS)
                const cadastralLayer = new OL.layer.Tile({
                    source: new OL.source.TileWMS({
                        url: 'https://api.vworld.kr/req/wms',
                        params: {
                            service: 'WMS',
                            request: 'GetMap',
                            version: '1.3.0',
                            layers: 'lp_pa_cbnd_bubun',
                            styles: '',
                            crs: 'EPSG:3857',
                            format: 'image/png',
                            transparent: true,
                            key: apiKey,
                            domain: window.location.hostname
                        }
                    }),
                    zIndex: 15,
                    visible: false,
                    minZoom: 14
                });
                cadastralLayer.set('name', 'LP_PA_CBND_BUBUN');
                cadastralLayerRef.current = cadastralLayer;

                // Other WMS layers
                const wmsLayers = ALL_LAYERS
                    .filter((l) => l.id !== 'LP_PA_CBND_BUBUN')
                    .map((layer) => {
                        const source = new OL.source.TileWMS({
                            url: 'https://api.vworld.kr/req/wms',
                            params: {
                                LAYERS: layer.id.toLowerCase(),
                                STYLES: layer.id.toLowerCase(),
                                CRS: 'EPSG:3857',
                                FORMAT: 'image/png',
                                TRANSPARENT: 'TRUE',
                                VERSION: '1.3.0',
                                key: apiKey,
                                DOMAIN: window.location.hostname
                            }
                        });

                        const olLayer = new OL.layer.Tile({
                            source,
                            visible: false,
                            zIndex: 5,
                            opacity: 0.8
                        });
                        olLayer.set('name', layer.id);
                        return olLayer;
                    });

                // Marker layer (single focus)
                const markerSrc = new OL.source.Vector();
                markerSourceRef.current = markerSrc;
                const markerLayer = new OL.layer.Vector({ source: markerSrc, zIndex: 20 });

                // Selection layer (multi)
                const selectionSrc = new OL.source.Vector();
                selectionSourceRef.current = selectionSrc;
                const selectionLayer = new OL.layer.Vector({ source: selectionSrc, zIndex: 21 });

                // Apartment markers (analytics)
                const aptMarkerSrc = new OL.source.Vector();
                aptMarkerSourceRef.current = aptMarkerSrc;
                const aptMarkerLayer = new OL.layer.Vector({
                    source: aptMarkerSrc,
                    zIndex: 30,
                    declutter: false
                });

                // Measure layer
                const measureSrc = new OL.source.Vector();
                measureSource.current = measureSrc;
                const measureLayer = new OL.layer.Vector({
                    source: measureSrc,
                    zIndex: 25,
                    style: new OL.style.Style({
                        fill: new OL.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
                        stroke: new OL.style.Stroke({ color: '#ffcc33', width: 2 }),
                        image: new OL.style.Circle({
                            radius: 7,
                            fill: new OL.style.Fill({ color: '#ffcc33' })
                        })
                    })
                });

                const map = new OL.Map({
                    target: 'vworld_map_target',
                    layers: [
                        baseLayer, grayLayer, midnightLayer, satelliteLayer,
                        hybridLayer, cadastralLayer, ...wmsLayers,
                        markerLayer, selectionLayer, aptMarkerLayer, measureLayer
                    ],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    })
                });

                // disable dblclick zoom
                map.getInteractions().forEach((i) => {
                    if (i instanceof OL.interaction.DoubleClickZoom) map.removeInteraction(i);
                });

                // dblclick: 단일 선택 + 줌 + 포커스 (지번추가 모드일 땐 무시)
                map.on('dblclick', async (evt) => {
                    if (measureModeRef.current) return;
                    if (parcelPickModeRef.current) return; // ✅ 지번추가 모드일 땐 더블클릭 무시
                    evt.preventDefault?.();

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat, apiKey);
                        if (!fd) return;

                        renderSingleFocus(fd);

                        const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                        map.getView().animate({ center: center3857, zoom: 15, duration: 350 });

                        const props = fd.properties || {};
                        if (props.pnu) {
                            onAddressSelect?.({
                                address: props.addr || '',
                                roadAddr: props.road || props.addr || '',
                                parcelAddr: props.addr || '',
                                x: lon,
                                y: lat,
                                pnu: props.pnu,
                                jimok: props.jimok,
                                area: props.parea,
                                price: props.jiga,
                                zone: props.unm
                            });
                        }

                        // dblclick는 "선택 초기화(단일)"로
                        selectedParcelsRef.current = [fd];
                        commitSelectedParcels([fd]);
                    } catch (e) {
                        console.error('dblclick error:', e);
                    }
                });

                // singleclick: 지번추가 모드일 때만 누적/토글, 아니면 단일
                map.on('singleclick', async (evt) => {
                    if (measureModeRef.current) return;

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat, apiKey);
                        if (!fd) return;

                        const pnu = getPnu(fd);
                        if (!pnu) return;

                        const props = fd.properties || {};

                        // ✅ 좌측 주소/기본정보 갱신은 "항상" 수행 (요구 유지)
                        onAddressSelect?.({
                            address: props.addr || '',
                            roadAddr: props.road || props.addr || '',
                            parcelAddr: props.addr || '',
                            x: lon,
                            y: lat,
                            pnu: props.pnu,
                            jimok: props.jimok,
                            area: props.parea,
                            price: props.jiga,
                            zone: props.unm
                        });

                        // ✅ 여기! props selectedParcels 대신 ref 사용
                        const current = selectedParcelsRef.current || [];

                        // ✅ 지번추가 모드일 때: 토글(추가/해제)
                        if (parcelPickModeRef.current) {
                            const exists = current.some((x) => getPnu(x) === pnu);
                            const next = exists
                                ? current.filter((x) => getPnu(x) !== pnu)
                                : [...current, fd];

                            // ✅ 즉시 ref 갱신(렌더 타이밍 이슈 방지)
                            selectedParcelsRef.current = next;

                            commitSelectedParcels(next);
                            // (선택) 멀티 선택 중에는 단일 포커스 마커는 굳이 안 바꿔도 됨
                            // renderSingleFocus(fd); 
                            return;
                        }

                        // ✅ 지번추가 모드 OFF일 때: 단일 선택
                        selectedParcelsRef.current = [fd];
                        commitSelectedParcels([fd]);
                        renderSingleFocus(fd);
                    } catch (e) {
                        console.error('singleclick error:', e);
                    }
                });

                window.map = map;
                setMapObj(map);
                setIsMapLoading(false);
            } catch (err) {
                console.error('OpenLayers Init Failed:', err);
                setMapError(`지도 생성 오류: ${err.message}`);
                setIsMapLoading(false);
            }
        };

        initMap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ====== Apartment Analytical Markers Rendering ======
    useEffect(() => {
        if (!mapObj || !aptMarkerSourceRef.current) return;
        const src = aptMarkerSourceRef.current;
        const OL = window.ol;

        src.clear(); // remove previous analytics markers

        if (!analyzedApartments || analyzedApartments.length === 0) return;

        const currentYear = new Date().getFullYear();
        const apiKey = API_CONFIG.VWORLD_KEY;
        const proxyBase = '/api/vworld';

        analyzedApartments.forEach(async (apt) => {
            if (!apt.jibun || !apt.dongName) return;

            // Format address for Geocoding: Jibun includes Sido/Sigungu typically?
            // "dongName jibun" works well for VWorld Search API
            const searchStr = `${apt.dongName} ${apt.jibun}`.trim();

            try {
                // Determine building age
                let ageStr = '- 년차';
                if (apt.buildYear && apt.buildYear.length === 4) {
                    const bYear = parseInt(apt.buildYear, 10);
                    if (!isNaN(bYear)) {
                        ageStr = `${currentYear - bYear + 1}년차`;
                    }
                }

                const url = `${proxyBase}/req/search?service=search&request=search&version=2.0` +
                    `&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(searchStr)}` +
                    `&type=ADDRESS&category=parcel&format=json&errorformat=json` +
                    `&key=${apiKey}&domain=${window.location.hostname}`;

                const res = await fetch(url);
                const data = await res.json();

                if (data?.response?.status === 'OK' && data.response.result?.items?.length > 0) {
                    const item = data.response.result.items[0];
                    const [lon, lat] = [parseFloat(item.point.x), parseFloat(item.point.y)];

                    const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                    const feature = new OL.Feature({
                        geometry: new OL.geom.Point(center3857)
                    });

                    // Format Overlay Text
                    const priceInEok = (apt.avg / 10000).toFixed(2);
                    const areaDisp = apt.avgArea.toFixed(1);
                    const labelText = `[ ${apt.name} ]\n${ageStr}\n평균 ${areaDisp}㎡\n${priceInEok}억원 / ${apt.count}건`;

                    feature.setStyle(
                        new OL.style.Style({
                            image: new OL.style.Circle({
                                radius: 25,
                                fill: new OL.style.Fill({
                                    color: 'rgba(255, 69, 58, 0.4)' // iOS Red with transparency
                                }),
                                stroke: new OL.style.Stroke({
                                    color: 'rgba(255, 69, 58, 0.9)',
                                    width: 2
                                })
                            }),
                            text: new OL.style.Text({
                                text: labelText,
                                font: 'bold 12px "Pretendard", "Apple SD Gothic Neo", sans-serif',
                                fill: new OL.style.Fill({ color: '#ffffff' }),
                                stroke: new OL.style.Stroke({ color: '#000000', width: 3 }),
                                offsetY: 0, // Center in circle
                                textAlign: 'center',
                                textBaseline: 'middle',
                                padding: [5, 5, 5, 5]
                            })
                        })
                    );

                    src.addFeature(feature);
                }
            } catch (e) {
                console.error('Map marker geocoding failed for:', searchStr, e);
            }
        });
    }, [analyzedApartments, mapObj]);

    // ====== Cadastral stabilization ======
    useEffect(() => {
        if (!mapObj) return;

        const cadastralLayer = cadastralLayerRef.current;
        if (!cadastralLayer) return;

        const view = mapObj.getView();
        if (!view) return;

        const cadastralOn = activeLayers.includes('LP_PA_CBND_BUBUN');
        const MIN_Z = 17;
        const MAX_Z = 19;

        const refresh = () => {
            const src = cadastralLayer.getSource?.();
            if (!src) return;
            if (typeof src.updateParams === 'function') src.updateParams({ _t: Date.now() });
            else if (typeof src.refresh === 'function') src.refresh();
            else if (typeof src.changed === 'function') src.changed();
        };

        if (!cadastralOn) {
            cadastralPendingRef.current = false;
            cadastralLayer.setVisible(false);
            return;
        }

        if (cadastralPendingRef.current) return;

        const zRaw = view.getZoom();
        const z = Number.isFinite(zRaw) ? zRaw : MIN_Z;
        const targetZoom = Math.max(MIN_Z, Math.min(MAX_Z, z));
        const needZoomMove = z < MIN_Z || z > MAX_Z;

        cadastralLayer.setVisible(false);

        const turnOn = () => {
            cadastralPendingRef.current = false;
            refresh();
            cadastralLayer.setVisible(true);
        };

        if (!needZoomMove) {
            refresh();
            cadastralLayer.setVisible(true);
            return;
        }

        cadastralPendingRef.current = true;
        mapObj.once('moveend', () => {
            const stillOn = activeLayersRef.current.includes('LP_PA_CBND_BUBUN');
            if (!stillOn) {
                cadastralPendingRef.current = false;
                cadastralLayer.setVisible(false);
                return;
            }
            turnOn();
        });

        view.animate({ zoom: targetZoom, duration: 350 });
    }, [mapObj, activeLayers]);

    // ====== Layer visibility ======
    useEffect(() => {
        if (!mapObj) return;

        mapObj.getLayers().forEach((layer) => {
            const name = layer.get('name');

            if (name === 'satellite') layer.setVisible(mapType === 'satellite');
            if (name === 'base') layer.setVisible(mapType === 'base');
            if (name === 'gray') layer.setVisible(mapType === 'gray');
            if (name === 'midnight') layer.setVisible(mapType === 'midnight');
            if (name === 'hybrid') layer.setVisible(mapType === 'satellite' && showHybrid);

            if (ALL_LAYERS.some((l) => l.id === name && l.id !== 'LP_PA_CBND_BUBUN')) {
                layer.setVisible(activeLayers.includes(name));
            }
        });
    }, [mapObj, mapType, showHybrid, activeLayers]);

    // ====== Update map center on selectedAddress ======
    useEffect(() => {
        if (!mapObj || !selectedAddress?.x || !selectedAddress?.y) return;
        try {
            const OL = window.ol;
            const x = parseFloat(selectedAddress.x);
            const y = parseFloat(selectedAddress.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;

            const center = OL.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
            mapObj.getView()?.animate({ center, duration: 500, zoom: 15 });
        } catch (e) {
            console.error('Map Update Error:', e);
        }
    }, [mapObj, selectedAddress]);

    // ====== Enrichment (search selection) ======
    useEffect(() => {
        if (!mapObj || !selectedAddress?.x || !selectedAddress?.y) return;
        if (enrichLockRef.current) return;

        const apiKey = API_CONFIG.VWORLD_KEY;
        const lon = parseFloat(selectedAddress.x);
        const lat = parseFloat(selectedAddress.y);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

        const key = `${lon},${lat},${selectedAddress.pnu || ''}`;
        if (lastEnrichKeyRef.current === key) return;
        lastEnrichKeyRef.current = key;

        const alreadyEnough =
            !!selectedAddress.pnu &&
            selectedAddress.jimok != null &&
            selectedAddress.area != null &&
            selectedAddress.price != null &&
            selectedAddress.zone != null;

        const run = async () => {
            try {
                const fd = await fetchParcelByLonLat(lon, lat, apiKey);
                if (!fd) return;

                // 검색/주소선택은 "단일 포커스"만 표시 (멀티 선택은 그대로 유지)
                renderSingleFocus(fd);

                if (alreadyEnough) return;

                const props = fd.properties || {};
                const enriched = {
                    ...selectedAddress,
                    address: props.addr || selectedAddress.address || '',
                    roadAddr: props.road || selectedAddress.roadAddr || props.addr || '',
                    parcelAddr: props.addr || selectedAddress.parcelAddr || '',
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

                if (changed && enriched.pnu) {
                    enrichLockRef.current = true;
                    onAddressSelect?.(enriched);
                    setTimeout(() => { enrichLockRef.current = false; }, 0);
                }
            } catch (e) {
                console.error('SelectedAddress enrich failed:', e);
            }
        };

        run();
    }, [mapObj, selectedAddress, fetchParcelByLonLat, renderSingleFocus, onAddressSelect]);

    // ====== Measurement logic (기존 유지) ======
    useEffect(() => {
        if (!mapObj || !measureMode) {
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

        const type = measureMode === 'area' ? 'Polygon' : 'LineString';
        const draw = new OL.interaction.Draw({
            source,
            type,
            style: new OL.style.Style({
                fill: new OL.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
                stroke: new OL.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new OL.style.Circle({
                    radius: 5,
                    stroke: new OL.style.Stroke({ color: 'rgba(0, 0, 0, 0.7)' }),
                    fill: new OL.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' })
                })
            })
        });

        const createMeasureTooltip = () => {
            if (measureTooltipElement.current) {
                measureTooltipElement.current.parentNode.removeChild(measureTooltipElement.current);
            }
            measureTooltipElement.current = document.createElement('div');
            measureTooltipElement.current.className =
                'ol-tooltip ol-tooltip-measure bg-black/70 text-white px-2 py-1 rounded text-xs';
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
            let tooltipCoord = evt.coordinate;

            listener = evt.feature.getGeometry().on('change', (e) => {
                const geom = e.target;
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

                if (measureTooltipElement.current) {
                    measureTooltipElement.current.innerHTML = output;
                    measureTooltip.current.setPosition(tooltipCoord);
                }
            });
        });

        draw.on('drawend', () => {
            if (measureTooltipElement.current) {
                measureTooltipElement.current.className =
                    'ol-tooltip ol-tooltip-static bg-black/70 text-white px-2 py-1 rounded text-xs border border-white/20 shadow-sm';
            }
            measureTooltip.current.setOffset([0, -7]);
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

    const handleZoom = useCallback((delta) => {
        if (!mapObj) return;
        const view = mapObj.getView();
        if (!view) return;
        const z = view.getZoom();
        if (Number.isFinite(z)) view.animate({ zoom: z + delta, duration: 250 });
    }, [mapObj]);

    const clearAll = () => {
        measureSource.current?.clear?.();
        document.querySelectorAll('.ol-tooltip-static')?.forEach((el) => el.remove());
        setMeasureMode(null);
        renderSingleFocus(null);
        markerSourceRef.current?.clear?.();
        commitSelectedParcels([]);
        setParcelPickMode(false);
    };

    // Categories for Filter
    const categories = [
        '전체',
        ...new Set(
            ALL_LAYERS
                .filter((l) => !['LP_PA_CBND_BUBUN', ...QUICK_LAYER_IDS].includes(l.id))
                .map((l) => l.category)
        )
    ];

    return (
        <div className={`flex-1 relative bg-gray-100 overflow-hidden group h-full w-full ${measureMode ? 'cursor-crosshair' : ''}`}>
            <div id="vworld_map_target" className="w-full h-full absolute inset-0 z-0 bg-gray-200 outline-none" tabIndex="0"></div>

            {/* Error/Loading */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                {isMapLoading && (
                    <div className="bg-white/90 px-4 py-2 rounded shadow text-gray-800 font-medium">
                        지도 데이터를 불러오는 중...
                    </div>
                )}
                {mapError && (
                    <div className="bg-white/90 px-4 py-2 rounded shadow text-red-600 font-bold">
                        {mapError}
                    </div>
                )}
            </div>

            {/* Left Tools Removed - Moved to Right Horizontal Pill */}

            {/* Main Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-2 items-end">

                {/* Main Row: Map Utilities (Zoom, Measure, Select, Clear) and Submenu Toggles */}
                <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-10 w-max relative z-20">
                    <button onClick={() => handleZoom(1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="확대">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button onClick={() => handleZoom(-1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="축소">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button onClick={() => { setMeasureMode(measureMode === 'distance' ? null : 'distance'); setParcelPickMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="거리 재기">
                        거리
                    </button>
                    <button onClick={() => { setMeasureMode(measureMode === 'area' ? null : 'area'); setParcelPickMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'area' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="면적 재기">
                        면적
                    </button>
                    <button onClick={() => { setMeasureMode(null); setParcelPickMode((v) => !v); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${parcelPickMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="지번 다중선택">
                        다중지번
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button onClick={clearAll} className="px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap text-gray-500 hover:bg-red-50 hover:text-red-500" title="모두 지우기">
                        지우기
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-2"></div>

                    {/* UI Map Controls Toggles */}
                    <div className="flex items-center gap-1 h-full bg-gray-100 rounded p-0.5">
                        <button
                            onClick={() => setShowMapTypes(!showMapTypes)}
                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap shadow-sm border
                                ${showMapTypes ? 'bg-white text-gray-800 border-gray-300' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-200'}`}
                        >
                            지도종류
                        </button>
                        <button
                            onClick={() => setShowZones(!showZones)}
                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap shadow-sm border
                                ${showZones ? 'bg-white text-gray-800 border-gray-300' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-200'}`}
                        >
                            지역지구
                        </button>
                    </div>
                </div>

                {/* Sub Row 1: Base Map Types, Hybrid (명칭), and Cadastral (지적도) */}
                {showMapTypes && (
                    <div className="flex items-center w-max gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-8 animate-fade-in-down relative z-10 transition-all origin-top-right transform">
                        <div className="flex items-center">
                            {[
                                { id: 'base', label: '일반지도' },
                                { id: 'gray', label: '백지도' },
                                { id: 'midnight', label: '야간' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setMapType(type.id)}
                                    className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                        ${mapType === type.id
                                            ? 'bg-gray-800 text-white shadow-sm'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-0.5"></div>

                        <div className="flex bg-gray-100 rounded p-0.5 h-full">
                            <button
                                onClick={() => setMapType('satellite')}
                                className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                    ${mapType === 'satellite'
                                        ? 'bg-gray-800 text-white shadow-sm'
                                        : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                            >
                                위성지도
                            </button>
                            <button
                                onClick={() => setShowHybrid(!showHybrid)}
                                className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                    ${showHybrid ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                            >
                                명칭
                            </button>
                        </div>

                        <div className="w-px h-4 bg-gray-300 mx-0.5"></div>

                        <button
                            onClick={() => toggleLayer('LP_PA_CBND_BUBUN')}
                            className={`px-2.5 h-full text-[10px] font-bold rounded shadow-sm border transition-all whitespace-nowrap
                                ${activeLayers.includes('LP_PA_CBND_BUBUN')
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            지적도
                        </button>
                    </div>
                )}

                {/* Sub Row 2: All Layers and Basic Area Layers */}
                {showZones && (
                    <div className="flex items-center w-max gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-8 animate-fade-in-down relative z-10 transition-all origin-top-right transform">
                        <button
                            onClick={() => setShowLayerMenu(true)}
                            className="px-2 h-full text-[10px] font-bold rounded shadow-sm border transition-all whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800 border-gray-800"
                        >
                            전체레이어
                        </button>

                        <div className="w-px h-4 bg-gray-300 mx-1"></div>

                        <div className="flex gap-0.5 h-full">
                            {BASIC_LAYERS.map((id) => {
                                const layer = ALL_LAYERS.find((l) => l.id === id);
                                if (!layer) return null;
                                const isActive = activeLayers.includes(id);
                                return (
                                    <button
                                        key={id}
                                        onClick={() => toggleLayer(id)}
                                        className={`px-1.5 h-full text-[10px] font-bold rounded transition-all whitespace-nowrap overflow-hidden text-ellipsis
                                            ${isActive
                                                ? 'bg-teal-600 text-white shadow-sm'
                                                : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                                        title={layer.label}
                                    >
                                        {layer.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Full Layer Modal */}
            {showLayerMenu && (
                <div
                    className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex justify-end"
                    onClick={() => setShowLayerMenu(false)}
                >
                    <div
                        className="w-[320px] h-full bg-white shadow-2xl flex flex-col animate-slide-left pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-sm">전체 레이어 목록</h3>
                            <button onClick={() => setShowLayerMenu(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                                ✕
                            </button>
                        </div>

                        <div className="p-2 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
                            {categories.map((cat) => (
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

                        <div className="flex-1 overflow-y-auto p-3 space-y-6">
                            {['용도지역', '용도지구', '용도구역', '도시계획', '환경/산림', '재해/안전', '수자원/해양', '행정/기타'].map((category) => {
                                if (selectedCategory !== '전체' && selectedCategory !== category) return null;
                                const categoryLayers = ALL_LAYERS.filter(
                                    (l) => l.category === category && !['LP_PA_CBND_BUBUN', ...BASIC_LAYERS].includes(l.id)
                                );
                                if (categoryLayers.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h4 className="text-[11px] font-bold text-gray-400 mb-2 border-b border-gray-100 pb-1 sticky top-0 bg-white/95 backdrop-blur z-10">
                                            {category}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoryLayers.map((layer) => {
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
