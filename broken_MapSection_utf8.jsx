import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../../config/api';
import { ALL_LAYERS, QUICK_LAYER_IDS, BASIC_LAYERS } from '../../config/layers';

const MapSection = ({
    selectedAddress,
    onAddressSelect,
    selectedParcels = [],
    onParcelsChange,
    analyzedApartments = [],
    isAnalysisOpen,
    setIsAnalysisOpen,
    isSidebarOpen,
    setIsSidebarOpen
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
    const [selectedCategory, setSelectedCategory] = useState('?꾩껜');

    // Stats
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);

    // Measurement State
    const [measureMode, setMeasureMode] = useState(null); // 'distance' | 'area' | null
    const measureModeRef = useRef(null);
    useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);

    // Parcel Select Mode (吏踰덉텛媛)
    const [parcelPickMode, setParcelPickMode] = useState(false);
    const parcelPickModeRef = useRef(false);
    useEffect(() => { parcelPickModeRef.current = parcelPickMode; }, [parcelPickMode]);

    // Radius Mode (諛섍꼍)
    const [radiusMode, setRadiusMode] = useState(false);
    const radiusSourceRef = useRef(null);

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

    const markerSourceRef = useRef(null);     // ?⑥씪 ?ъ빱??寃???붾툝?대┃ ??
    const selectionSourceRef = useRef(null);  // 硫???좏깮(Shift ?꾩쟻)
    const aptMarkerSourceRef = useRef(null);  // ?꾪뙆??遺꾩꽍 留덉빱

    const getPnu = (fd) => fd?.properties?.pnu;

    const toggleLayer = (layerId) => {
        setActiveLayers((prev) => {
            const isActive = prev.includes(layerId);
            return isActive ? prev.filter((id) => id !== layerId) : [...prev, layerId];
        });
    };

    // ====== Fetcher (Proxy path) ======
    const fetchParcelByLonLat = useCallback(async (lon, lat) => {
        const base = API_CONFIG.VWORLD_BASE_URL || '/api/vworld';
        const url =
            `${base}/req/data?service=data&request=GetFeature&data=lp_pa_cbnd_bubun` +
            `&format=json&geomFilter=POINT(${lon} ${lat})&domain=${window.location.hostname}`;

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

    // 遺紐??곹깭 ?낅뜲?댄듃(以묒슂: prev=> ?뺥깭 湲덉?)
    const commitSelectedParcels = useCallback((nextList) => {
        const safe = Array.isArray(nextList) ? nextList : [];
        onParcelsChange?.(safe);
        renderSelectedParcels(safe);
    }, [onParcelsChange, renderSelectedParcels]);

    // props selectedParcels 蹂寃???吏?꾩뿉??諛섏쁺
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
                    setMapError('OpenLayers 濡쒕뱶 ?ㅽ뙣');
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

                const proxyMapUrl = API_CONFIG.VWORLD_WMTS_URL || '/api/vworld_wmts';

                // Base layers
                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/Base/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                baseLayer.set('name', 'base');

                const grayLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/white/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                grayLayer.set('name', 'gray');

                const midnightLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/midnight/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                midnightLayer.set('name', 'midnight');

                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/Satellite/{z}/{y}/{x}.jpeg`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${proxyMapUrl}/Hybrid/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 10,
                    visible: true
                });
                hybridLayer.set('name', 'hybrid');

                // Cadastral (WMS)
                const cadastralLayer = new OL.layer.Tile({
                    source: new OL.source.TileWMS({
                        url: `${API_CONFIG.VWORLD_BASE_URL}/req/wms`,
                        params: {
                            service: 'WMS',
                            request: 'GetMap',
                            version: '1.3.0',
                            layers: 'lp_pa_cbnd_bubun',
                            styles: '',
                            crs: 'EPSG:3857',
                            format: 'image/png',
                            transparent: true,
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
                            url: `${API_CONFIG.VWORLD_BASE_URL}/req/wms`,
                            params: {
                                LAYERS: layer.id.toLowerCase(),
                                STYLES: layer.id.toLowerCase(),
                                CRS: 'EPSG:3857',
                                FORMAT: 'image/png',
                                TRANSPARENT: 'TRUE',
                                VERSION: '1.3.0',
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
                    declutter: false,
                    style: (feature) => {
                        const map = window.map; // stored globally in init
                        const zoom = map ? map.getView().getZoom() : 16;
                        const isHovered = feature.get('hovered') === true;

                        const aptName = feature.get('aptName');
                        const ageStr = feature.get('ageStr');
                        const areaDisp = feature.get('areaDisp');
                        const priceInEok = feature.get('priceInEok');
                        const count = feature.get('count');

                        // Zoom cutoff threshold
                        const isZoomedOut = zoom < 15.5;
                        const showFull = !isZoomedOut || isHovered;

                        let labelText;
                        if (showFull) {
                            labelText = `[ ${aptName} ]\n${ageStr}\n?됯퇏 ${areaDisp}??n${priceInEok}?듭썝 / ${count}嫄?;
                        } else {
                            labelText = `[ ${aptName} ]\n${priceInEok}?듭썝`;
                        }

                        const radius = isHovered ? 32 : 25;
                        const zIndex = isHovered ? 1000 : 30;
                        const strokeWidth = isHovered ? 3 : 2;
                        const bgColor = isHovered ? 'rgba(255, 69, 58, 0.8)' : 'rgba(255, 69, 58, 0.4)';

                        return new OL.style.Style({
                            zIndex: zIndex,
                            image: new OL.style.Circle({
                                radius: radius,
                                fill: new OL.style.Fill({
                                    color: bgColor
                                }),
                                stroke: new OL.style.Stroke({
                                    color: 'rgba(255, 69, 58, 0.9)',
                                    width: strokeWidth
                                })
                            }),
                            text: new OL.style.Text({
                                text: labelText,
                                font: 'bold 12px "Pretendard", "Apple SD Gothic Neo", sans-serif',
                                fill: new OL.style.Fill({ color: '#ffffff' }),
                                stroke: new OL.style.Stroke({ color: '#000000', width: 3 }),
                                offsetY: 0,
                                textAlign: 'center',
                                textBaseline: 'middle',
                                padding: [5, 5, 5, 5]
                            })
                        });
                    }
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

                // Radius overlay layer
                const radiusSrc = new OL.source.Vector();
                radiusSourceRef.current = radiusSrc;
                const radiusLayer = new OL.layer.Vector({
                    source: radiusSrc,
                    zIndex: 24,
                    style: (feature) => {
                        if (feature.get('type') === 'label') {
                            return new OL.style.Style({
                                text: new OL.style.Text({
                                    text: feature.get('text'),
                                    font: 'bold 12px "Pretendard", sans-serif',
                                    fill: new OL.style.Fill({ color: '#dc2626' }),
                                    stroke: new OL.style.Stroke({ color: '#ffffff', width: 3 }),
                                    offsetY: 0
                                })
                            });
                        }
                        return new OL.style.Style({
                            stroke: new OL.style.Stroke({
                                color: 'rgba(220, 38, 38, 0.8)',
                                width: 2,
                                lineDash: [5, 5]
                            }),
                            fill: new OL.style.Fill({
                                color: 'rgba(220, 38, 38, 0.05)'
                            })
                        });
                    }
                });

                const map = new OL.Map({
                    target: 'vworld_map_target',
                    controls: OL.control.defaults.defaults({ zoom: false, attribution: false }),
                    layers: [
                        baseLayer, grayLayer, midnightLayer, satelliteLayer,
                        hybridLayer, cadastralLayer, ...wmsLayers,
                        markerLayer, selectionLayer, aptMarkerLayer, radiusLayer, measureLayer
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

                // dblclick: ?⑥씪 ?좏깮 + 以?+ ?ъ빱??(吏踰덉텛媛 紐⑤뱶????臾댁떆)
                map.on('dblclick', async (evt) => {
                    if (measureModeRef.current) return;
                    if (parcelPickModeRef.current) return; // ??吏踰덉텛媛 紐⑤뱶?????붾툝?대┃ 臾댁떆
                    evt.preventDefault?.();

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat);
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

                        // dblclick??"?좏깮 珥덇린???⑥씪)"濡?                        selectedParcelsRef.current = [fd];
                        commitSelectedParcels([fd]);
                    } catch (e) {
                        console.error('dblclick error:', e);
                    }
                });

                // singleclick: 吏踰덉텛媛 紐⑤뱶???뚮쭔 ?꾩쟻/?좉?, ?꾨땲硫??⑥씪
                map.on('singleclick', async (evt) => {
                    if (measureModeRef.current) return;

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat);
                        if (!fd) return;

                        const pnu = getPnu(fd);
                        if (!pnu) return;

                        const props = fd.properties || {};

                        // ??醫뚯륫 二쇱냼/湲곕낯?뺣낫 媛깆떊? "??긽" ?섑뻾 (?붽뎄 ?좎?)
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

                        // ???ш린! props selectedParcels ???ref ?ъ슜
                        const current = selectedParcelsRef.current || [];

                        // ??吏踰덉텛媛 紐⑤뱶???? ?좉?(異붽?/?댁젣)
                        if (parcelPickModeRef.current) {
                            const exists = current.some((x) => getPnu(x) === pnu);
                            const next = exists
                                ? current.filter((x) => getPnu(x) !== pnu)
                                : [...current, fd];

                            // ??利됱떆 ref 媛깆떊(?뚮뜑 ??대컢 ?댁뒋 諛⑹?)
                            selectedParcelsRef.current = next;

                            commitSelectedParcels(next);
                            // (?좏깮) 硫???좏깮 以묒뿉???⑥씪 ?ъ빱??留덉빱??援녹씠 ??諛붽퓭????                            // renderSingleFocus(fd); 
                            return;
                        }

                        // ??吏踰덉텛媛 紐⑤뱶 OFF???? ?⑥씪 ?좏깮
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
                setMapError(`吏???앹꽦 ?ㅻ쪟: ${err.message}`);
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
        const proxyBase = '/api/vworld';

        analyzedApartments.forEach(async (apt) => {
            if (!apt.jibun || !apt.dongName) return;

            // Format address for Geocoding: Jibun includes Sido/Sigungu typically?
            // "dongName jibun" works well for VWorld Search API
            const searchStr = `${apt.dongName} ${apt.jibun}`.trim();

            try {
                // Determine building age
                let ageStr = '- ?꾩감';
                if (apt.buildYear && apt.buildYear.length === 4) {
                    const bYear = parseInt(apt.buildYear, 10);
                    if (!isNaN(bYear)) {
                        ageStr = `${currentYear - bYear + 1}?꾩감`;
                    }
                }

                const url = `${proxyBase}/req/search?service=search&request=search&version=2.0` +
                    `&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(searchStr)}` +
                    `&type=ADDRESS&category=parcel&format=json&errorformat=json` +
                    `&domain=${window.location.hostname}`;

                const res = await fetch(url);
                const data = await res.json();

                if (data?.response?.status === 'OK' && data.response.result?.items?.length > 0) {
                    const item = data.response.result.items[0];
                    const [lon, lat] = [parseFloat(item.point.x), parseFloat(item.point.y)];

                    const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                    const feature = new OL.Feature({
                        geometry: new OL.geom.Point(center3857)
                    });

                    const priceInEok = (apt.avg / 10000).toFixed(2);
                    const areaDisp = apt.avgArea.toFixed(1);

                    feature.setProperties({
                        aptName: apt.name,
                        ageStr: ageStr,
                        areaDisp: areaDisp,
                        priceInEok: priceInEok,
                        count: apt.count,
                        layerType: 'aptMarker'
                    });

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

    // ====== Layout Hover Interaction ======
    useEffect(() => {
        if (!mapObj) return;

        const cursorHoverHandler = (e) => {
            if (e.dragging) return;

            const pixel = mapObj.getEventPixel(e.originalEvent);
            const hitFeatures = [];

            mapObj.forEachFeatureAtPixel(pixel, (feature, layer) => {
                if (feature.get('layerType') === 'aptMarker') {
                    hitFeatures.push(feature);
                }
            });

            const targetFeature = hitFeatures.length > 0 ? hitFeatures[0] : null;

            // Set hovered state
            let changed = false;
            const src = aptMarkerSourceRef.current;
            if (src) {
                src.getFeatures().forEach(f => {
                    const isHovered = (f === targetFeature);
                    if (f.get('hovered') !== isHovered) {
                        f.set('hovered', isHovered);
                        changed = true;
                    }
                });
            }

            // Change pointer styling
            mapObj.getTargetElement().style.cursor = targetFeature ? 'pointer' : '';
        };

        mapObj.on('pointermove', cursorHoverHandler);

        return () => {
            mapObj.un('pointermove', cursorHoverHandler);
        };
    }, [mapObj]);

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
                const fd = await fetchParcelByLonLat(lon, lat);
                if (!fd) return;

                // 寃??二쇱냼?좏깮? "?⑥씪 ?ъ빱??留??쒖떆 (硫???좏깮? 洹몃?濡??좎?)
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

    // ====== Measurement logic ======
    useEffect(() => {
        if (!mapObj) return;

        // Cleanup based on respective state
        if (!measureMode) {
            measureSource.current?.clear();
            if (drawInteraction.current) {
                mapObj.removeInteraction(drawInteraction.current);
                drawInteraction.current = null;
            }
            if (helpTooltipElement.current) {
                mapObj.removeOverlay(helpTooltip.current);
            }
        }

        if (!radiusMode) {
            radiusSourceRef.current?.clear();
        }

        // Only instantiate Draw interaction if measureMode is active
        if (!measureMode) return;

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
                        ? (Math.round(area / 1000000 * 100) / 100) + ' km짼'
                        : (Math.round(area * 100) / 100) + ' m짼';
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
    }, [mapObj, measureMode, radiusMode]);

    const handleZoom = useCallback((delta) => {
        if (!mapObj) return;
        const view = mapObj.getView();
        if (!view) return;
        const z = view.getZoom();
        if (Number.isFinite(z)) view.animate({ zoom: z + delta, duration: 250 });
    }, [mapObj]);

    // --------------------------------------------------------
    // RADIUS DRAWING LOGIC
    // --------------------------------------------------------
    const toggleRadiusMode = () => {
        if (!radiusSourceRef.current || !mapObj) return;

        const nextMode = !radiusMode;
        setRadiusMode(nextMode);

        if (!nextMode) {
            radiusSourceRef.current.clear();
            return;
        }

        radiusSourceRef.current.clear();
        setMeasureMode(null);
        setParcelPickMode(false);

        // Find center
        let centerLng, centerLat;
        if (selectedAddress && selectedAddress.x && selectedAddress.y) {
            centerLng = selectedAddress.x;
            centerLat = selectedAddress.y;
        } else if (selectedAddress && selectedAddress.lon && selectedAddress.lat) {
            centerLng = selectedAddress.lon;
            centerLat = selectedAddress.lat;
        } else if (selectedParcels && selectedParcels.length > 0) {
            const ext = selectedParcels[0].getGeometry().getExtent();
            const center3857 = window.OL.extent.getCenter(ext);
            const center4326 = window.OL.proj.transform(center3857, 'EPSG:3857', 'EPSG:4326');
            centerLng = center4326[0];
            centerLat = center4326[1];
        } else {
            const mapCenter = mapObj.getView().getCenter();
            const center4326 = window.OL.proj.transform(mapCenter, 'EPSG:3857', 'EPSG:4326');
            centerLng = center4326[0];
            centerLat = center4326[1];
        }

        if (!centerLng || !centerLat) return;

        const center3857 = window.OL.proj.transform([Number(centerLng), Number(centerLat)], 'EPSG:4326', 'EPSG:3857');
        const distances = [500, 1000, 1500, 3000, 5000, 10000];
        const labels = ['500m', '1km', '1.5km', '3km', '5km', '10km'];

        distances.forEach((dist, idx) => {
            // Projection distortion correction for radius in EPSG:3857
            const radius3857 = dist / Math.cos(Number(centerLat) * Math.PI / 180);

            const circleFeature = new window.OL.Feature({
                geometry: new window.OL.geom.Circle(center3857, radius3857),
                type: 'circle'
            });

            // Point for text label on top circumference
            const labelFeature = new window.OL.Feature({
                geometry: new window.OL.geom.Point([center3857[0], center3857[1] + radius3857]),
                type: 'label',
                text: labels[idx]
            });

            radiusSourceRef.current.addFeature(circleFeature);
            radiusSourceRef.current.addFeature(labelFeature);
        });

        // Zoom to fit largest radius (10km approx zoom 11 or 12 depending on viewport)
        mapObj.getView().animate({ center: center3857, zoom: 12, duration: 800 });
    };

    // --------------------------------------------------------
    // CLEAR EVERYTHING
    // --------------------------------------------------------
    const clearAll = () => {
        measureSource.current?.clear?.();
        document.querySelectorAll('.ol-tooltip-static')?.forEach((el) => el.remove());
        setMeasureMode(null);
        renderSingleFocus(null);
        radiusSourceRef.current?.clear?.();
        setRadiusMode(false);
        markerSourceRef.current?.clear?.();
        commitSelectedParcels([]);
        setParcelPickMode(false);
    };

    // Categories for Filter
    const categories = [
        '?꾩껜',
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
                        吏???곗씠?곕? 遺덈윭?ㅻ뒗 以?..
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
                    {/* Toolbar Toggle Buttons */}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`px-3 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${isSidebarOpen ? 'bg-ink text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="?ъ씠?쒕컮 ?뺣낫李??좉?">
                        {isSidebarOpen ? '?뺣낫 ?④린湲? : '??곸? ?뺣낫'}
                    </button>
                    <button onClick={() => setIsAnalysisOpen(!isAnalysisOpen)} className={`px-3 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${isAnalysisOpen ? 'bg-ink text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="?섎떒 ?ㅺ굅?섍? 遺꾩꽍 ?⑤꼸 ?좉?">
                        {isAnalysisOpen ? '遺꾩꽍 ?④린湲? : '?ㅺ굅?섍? 遺꾩꽍'}
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button onClick={() => handleZoom(1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="?뺣?">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button onClick={() => handleZoom(-1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="異뺤냼">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button onClick={() => { setMeasureMode(measureMode === 'distance' ? null : 'distance'); setParcelPickMode(false); setRadiusMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="嫄곕━ ?ш린">
                        嫄곕━
                    </button>
                    <button onClick={() => { setMeasureMode(measureMode === 'area' ? null : 'area'); setParcelPickMode(false); setRadiusMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'area' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="硫댁쟻 ?ш린">
                        硫댁쟻
                    </button>
                    <button onClick={() => { setMeasureMode(null); setParcelPickMode(false); toggleRadiusMode(); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${radiusMode ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="諛섍꼍 洹몃━湲?>
                        諛섍꼍
                    </button>
                    <button onClick={() => { setMeasureMode(null); setParcelPickMode((v) => !v); setRadiusMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${parcelPickMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="吏踰??ㅼ쨷?좏깮">
                        ?ㅼ쨷吏踰?                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-1"></div>

                    <button onClick={clearAll} className="px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap text-gray-500 hover:bg-red-50 hover:text-red-500" title="紐⑤몢 吏?곌린">
                        吏?곌린
                    </button>

                    <div className="w-px h-5 bg-gray-300 mx-2"></div>

                    {/* UI Map Controls Toggles */}
                    <div className="flex items-center gap-1 h-full bg-gray-100 rounded p-0.5">
                        <button
                            onClick={() => setShowMapTypes(!showMapTypes)}
                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap shadow-sm border
                                ${showMapTypes ? 'bg-white text-gray-800 border-gray-300' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-200'}`}
                        >
                            吏?꾩쥌瑜?                        </button>
                        <button
                            onClick={() => setShowZones(!showZones)}
                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap shadow-sm border
                                ${showZones ? 'bg-white text-gray-800 border-gray-300' : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-200'}`}
                        >
                            吏???援?                        </button>
                    </div>
                </div>

                {/* Sub Row 1: Base Map Types, Hybrid (紐낆묶), and Cadastral (吏?곷룄) */}
                {showMapTypes && (
                    <div className="flex items-center w-max gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-8 animate-fade-in-down relative z-10 transition-all origin-top-right transform">
                        <div className="flex items-center">
                            {[
                                { id: 'base', label: '?쇰컲吏?? },
                                { id: 'gray', label: '諛깆??? },
                                { id: 'midnight', label: '?쇨컙' }
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
                                ?꾩꽦吏??                            </button>
                            <button
                                onClick={() => setShowHybrid(!showHybrid)}
                                className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                    ${showHybrid ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                            >
                                紐낆묶
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
                            吏?곷룄
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
                            ?꾩껜?덉씠??                        </button>

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
                            <h3 className="font-bold text-gray-800 text-sm">?꾩껜 ?덉씠??紐⑸줉</h3>
                            <button onClick={() => setShowLayerMenu(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                                ??                            </button>
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
                            {['?⑸룄吏??, '?⑸룄吏援?, '?⑸룄援ъ뿭', '?꾩떆怨꾪쉷', '?섍꼍/?곕┝', '?ы빐/?덉쟾', '?섏옄???댁뼇', '?됱젙/湲고?'].map((category) => {
                                if (selectedCategory !== '?꾩껜' && selectedCategory !== category) return null;
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
