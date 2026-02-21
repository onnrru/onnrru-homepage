import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_CONFIG } from '../../config/api';
import { ALL_LAYERS, QUICK_LAYER_IDS, BASIC_LAYERS } from '../../config/layers';
import { VWorldService } from '../../services/vworldService';
import MapControls from './MapControls';
import { useMapMeasurements } from './useMapMeasurements';
import { useRadiusDrawing } from './useRadiusDrawing';

import { useDashboard } from '../../context/DashboardContext';

const MapSection = () => {
    const {
        selectedAddress,
        setSelectedAddress,
        selectedParcels,
        setSelectedParcels,
        analyzedApartments,
        isAnalysisOpen,
        setIsAnalysisOpen,
        isSidebarOpen,
        setIsSidebarOpen
    } = useDashboard();

    const onAddressSelect = setSelectedAddress;
    const onParcelsChange = setSelectedParcels;

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
    const fetchParcelByLonLat = useCallback(async (lon, lat) => {
        return await VWorldService.fetchParcelByLonLat(lon, lat);
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
                        url: `${proxyMapUrl}/req/wms`,
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
                            url: `${proxyMapUrl}/req/wms`,
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
                            labelText = `[ ${aptName} ]\n${ageStr}\n평균 ${areaDisp}㎡\n${priceInEok}억원 / ${count}건`;
                        } else {
                            labelText = `[ ${aptName} ]\n${priceInEok}억원`;
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

        analyzedApartments.forEach(async (apt) => {
            if (!apt.jibun || !apt.dongName) return;

            // Format address for Geocoding
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

                // Use Centralized Service with Caching
                const item = await VWorldService.searchAddress(searchStr);

                if (item) {
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

    const handleZoom = useCallback((delta) => {
        if (!mapObj) return;
        const view = mapObj.getView();
        if (!view) return;
        const z = view.getZoom();
        if (Number.isFinite(z)) view.animate({ zoom: z + delta, duration: 250 });
    }, [mapObj]);

    const clearAll = useCallback(() => {
        clearMeasurements();
        clearRadius();
        setMeasureMode(null);
        renderSingleFocus(null);
        setRadiusMode(false);
        markerSourceRef.current?.clear?.();
        commitSelectedParcels([]);
        setParcelPickMode(false);
    }, [clearMeasurements, clearRadius, commitSelectedParcels, renderSingleFocus]);

    // Categories for Filter
    const categories = useMemo(() => [
        '전체',
        ...new Set(
            ALL_LAYERS
                .filter((l) => !['LP_PA_CBND_BUBUN', ...QUICK_LAYER_IDS].includes(l.id))
                .map((l) => l.category)
        )
    ], []);

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

            {/* UI Controls */}
            <MapControls
                handleZoom={handleZoom}
                measureMode={measureMode}
                setMeasureMode={setMeasureMode}
                radiusMode={radiusMode}
                toggleRadiusMode={toggleRadiusMode}
                clearAll={clearAll}
                showMapTypes={showMapTypes}
                setShowMapTypes={setShowMapTypes}
                showZones={showZones}
                setShowZones={setShowZones}
                mapType={mapType}
                setMapType={setMapType}
                showHybrid={showHybrid}
                setShowHybrid={setShowHybrid}
                toggleLayer={toggleLayer}
                activeLayers={activeLayers}
                showLayerMenu={showLayerMenu}
                setShowLayerMenu={setShowLayerMenu}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />
        </div>
    );
};

export default MapSection;
