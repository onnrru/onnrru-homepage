import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_CONFIG } from '../../config/api';
import { ALL_LAYERS, QUICK_LAYER_IDS } from '../../config/layers';
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
        parcelPickMode,
        setParcelPickMode
  } = useDashboard();

  console.log('[MapSection] v1.0.7 - Unified API Version');

  const onAddressSelect = setSelectedAddress;
    const onParcelsChange = setSelectedParcels;

    const [mapObj, setMapObj] = useState(null);

    const [showHybrid, setShowHybrid] = useState(false);
    const [mapType, setMapType] = useState('satellite');
    const [activeLayers, setActiveLayers] = useState([]);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [showMapTypes, setShowMapTypes] = useState(false);
    const [showZones, setShowZones] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [measureMode, setMeasureMode] = useState(null);
    const [radiusMode, setRadiusMode] = useState(false);

    const toggleRadiusMode = () => setRadiusMode((prev) => !prev);

    const cadastralLayerRef = useRef(null);
    const cadastralPendingRef = useRef(false);
    const enrichLockRef = useRef(false);
    const lastEnrichKeyRef = useRef(null);

    const activeLayersRef = useRef([]);
    useEffect(() => { activeLayersRef.current = activeLayers; }, [activeLayers]);

    const measureModeRef = useRef(measureMode);
    useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);

    const parcelPickModeRef = useRef(parcelPickMode);
    useEffect(() => { parcelPickModeRef.current = parcelPickMode; }, [parcelPickMode]);

    const markerSourceRef = useRef(null);
    const selectionSourceRef = useRef(null);
    const aptMarkerSourceRef = useRef(null);

    const { clearMeasurements } = useMapMeasurements(mapObj, measureMode);
    const { toggleRadius, clearRadius } = useRadiusDrawing(mapObj, radiusMode, selectedAddress, selectedParcels);

    useEffect(() => {
        toggleRadius(radiusMode);
    }, [radiusMode, toggleRadius]);

    const getPnu = (fd) => fd?.properties?.pnu;

    const toggleLayer = (layerId) => {
        setActiveLayers((prev) => {
            const isActive = prev.includes(layerId);
            return isActive ? prev.filter((id) => id !== layerId) : [...prev, layerId];
        });
    };

    const fetchParcelByLonLat = useCallback(async (lon, lat) => {
        return await VWorldService.fetchParcelByLonLat(lon, lat);
    }, []);

    const renderSingleFocus = useCallback((featureData) => {
        const OL = window.ol;
        const src = markerSourceRef.current;
        if (!OL || !src) return;

        src.clear();
        if (!featureData) return;

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

    const commitSelectedParcels = useCallback((nextList) => {
        const safe = Array.isArray(nextList) ? nextList : [];
        onParcelsChange?.(safe);
        renderSelectedParcels(safe);
    }, [onParcelsChange, renderSelectedParcels]);

    const selectedParcelsRef = useRef(selectedParcels);
    useEffect(() => {
        selectedParcelsRef.current = selectedParcels;
        if (!mapObj) return;
        renderSelectedParcels(selectedParcels);
    }, [mapObj, selectedParcels, renderSelectedParcels]);

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 20;

        const initMap = () => {
            if (mapObj) return;

            if (!window.ol) {
                retryCount += 1;
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

                const proxyMapUrl = API_CONFIG.VWORLD_MAP_URL;

                const baseLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${API_CONFIG.VWORLD_DIRECT_URL}/req/wmts/1.0.0/${API_CONFIG.VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                baseLayer.set('name', 'base');

                const grayLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${API_CONFIG.VWORLD_DIRECT_URL}/req/wmts/1.0.0/${API_CONFIG.VWORLD_API_KEY}/white/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                grayLayer.set('name', 'gray');

                const midnightLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${API_CONFIG.VWORLD_DIRECT_URL}/req/wmts/1.0.0/${API_CONFIG.VWORLD_API_KEY}/midnight/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: false
                });
                midnightLayer.set('name', 'midnight');

                const satelliteLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${API_CONFIG.VWORLD_DIRECT_URL}/req/wmts/1.0.0/${API_CONFIG.VWORLD_API_KEY}/Satellite/{z}/{y}/{x}.jpeg`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 0,
                    visible: true
                });
                satelliteLayer.set('name', 'satellite');

                const hybridLayer = new OL.layer.Tile({
                    source: new OL.source.XYZ({
                        url: `${API_CONFIG.VWORLD_DIRECT_URL}/req/wmts/1.0.0/${API_CONFIG.VWORLD_API_KEY}/Hybrid/{z}/{y}/{x}.png`,
                        attributions: 'VWorld'
                    }),
                    zIndex: 20, // Labels above zones
                    visible: true
                });
                hybridLayer.set('name', 'hybrid');

                const cadastralLayer = new OL.layer.Tile({
                    source: new OL.source.TileWMS({
                        url: `${proxyMapUrl}/wms`,
                        params: {
                            SERVICE: 'WMS',
                            REQUEST: 'GetMap',
                            VERSION: '1.3.0',
                            LAYERS: 'LP_PA_CBND_BUBUN',
                            STYLES: 'LP_PA_CBND_BUBUN',
                            CRS: 'EPSG:3857',
                            FORMAT: 'image/png',
                            TRANSPARENT: true
                        }
                    }),
                    zIndex: 35,
                    visible: false
                });
                cadastralLayer.set('name', 'LP_PA_CBND_BUBUN');
                cadastralLayerRef.current = cadastralLayer;

                const wmsLayers = ALL_LAYERS
                    .filter((l) => l.id !== 'LP_PA_CBND_BUBUN')
                    .map((layer) => {
                        const olLayer = new OL.layer.Tile({
                            source: new OL.source.TileWMS({
                                url: `${proxyMapUrl}/wms`,
                                params: {
                                    SERVICE: 'WMS',
                                    REQUEST: 'GetMap',
                                    VERSION: '1.3.0',
                                    LAYERS: layer.id,
                                    STYLES: layer.id,
                                    CRS: 'EPSG:3857',
                                    FORMAT: 'image/png',
                                    TRANSPARENT: 'TRUE'
                                }
                            }),
                            visible: false,
                            zIndex: 10,
                            opacity: 0.8
                        });
                        olLayer.set('name', layer.id);
                        return olLayer;
                    });

                const markerSrc = new OL.source.Vector();
                markerSourceRef.current = markerSrc;
                const markerLayer = new OL.layer.Vector({ source: markerSrc, zIndex: 40 });

                const selectionSrc = new OL.source.Vector();
                selectionSourceRef.current = selectionSrc;
                const selectionLayer = new OL.layer.Vector({ source: selectionSrc, zIndex: 41 });

                const aptMarkerSrc = new OL.source.Vector();
                aptMarkerSourceRef.current = aptMarkerSrc;
                const aptMarkerLayer = new OL.layer.Vector({
                    source: aptMarkerSrc,
                    zIndex: 30,
                    declutter: false,
                    style: (feature) => {
                        const map = window.map;
                        const zoom = map ? map.getView().getZoom() : 16;
                        const isHovered = feature.get('hovered') === true;

                        const aptName = feature.get('aptName');
                        const ageStr = feature.get('ageStr');
                        const areaDisp = feature.get('areaDisp');
                        const priceInEok = feature.get('priceInEok');
                        const count = feature.get('count');

                        const isZoomedOut = zoom < 15.5;
                        const showFull = !isZoomedOut || isHovered;

                        const labelText = showFull
                            ? `[ ${aptName} ]\n${ageStr}\n평균 ${areaDisp}㎡\n${priceInEok}억원 / ${count}건`
                            : `[ ${aptName} ]\n${priceInEok}억원`;

                        const radius = isHovered ? 32 : 25;
                        const zIndex = isHovered ? 1000 : 30;
                        const strokeWidth = isHovered ? 3 : 2;
                        const bgColor = isHovered ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 215, 0, 0.4)';

                        return new OL.style.Style({
                            zIndex,
                            image: new OL.style.Circle({
                                radius,
                                fill: new OL.style.Fill({ color: bgColor }),
                                stroke: new OL.style.Stroke({
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    width: strokeWidth
                                })
                            }),
                            text: new OL.style.Text({
                                text: labelText,
                                font: 'bold 12px "Pretendard", "Apple SD Gothic Neo", sans-serif',
                                fill: new OL.style.Fill({ color: '#222222' }),
                                stroke: new OL.style.Stroke({ color: '#ffffff', width: 3 }),
                                offsetY: 0,
                                textAlign: 'center',
                                textBaseline: 'middle',
                                padding: [5, 5, 5, 5]
                            })
                        });
                    }
                });

                const map = new OL.Map({
                    target: 'vworld_map_target',
                    controls: OL.control.defaults.defaults({ zoom: false, attribution: false }),
                    layers: [
                        baseLayer,
                        grayLayer,
                        midnightLayer,
                        satelliteLayer,
                        hybridLayer,
                        cadastralLayer,
                        ...wmsLayers,
                        markerLayer,
                        selectionLayer,
                        aptMarkerLayer
                    ],
                    view: new OL.View({
                        center: [14151740, 4511257],
                        zoom: 17,
                        minZoom: 6,
                        maxZoom: 19
                    })
                });

                map.getInteractions().forEach((i) => {
                    if (i instanceof OL.interaction.DoubleClickZoom) {
                        map.removeInteraction(i);
                    }
                });

                map.on('dblclick', async (evt) => {
                    if (measureModeRef.current) return;
                    evt.preventDefault?.();

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat);
                        if (!fd) return;

                        renderSingleFocus(fd);

                        const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                        map.getView().animate({ center: center3857, duration: 350 });

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

                        selectedParcelsRef.current = [fd];
                        commitSelectedParcels([fd]);
                    } catch (e) {
                        console.error('dblclick error:', e);
                    }
                });

                map.on('singleclick', async (evt) => {
                    if (measureModeRef.current) return;

                    // If not in multi-pick mode, single click does nothing to selection
                    if (!parcelPickModeRef.current) return;

                    const [lon, lat] = OL.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');

                    try {
                        const fd = await fetchParcelByLonLat(lon, lat);
                        if (!fd) return;

                        const pnu = getPnu(fd);
                        if (!pnu) return;

                        const current = selectedParcelsRef.current || [];
                        const exists = current.some((x) => getPnu(x) === pnu);
                        const next = exists
                            ? current.filter((x) => getPnu(x) !== pnu)
                            : [...current, fd];

                        selectedParcelsRef.current = next;
                        commitSelectedParcels(next);
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
    }, [mapObj, fetchParcelByLonLat, commitSelectedParcels, onAddressSelect, renderSingleFocus]);

    useEffect(() => {
        if (!mapObj || !aptMarkerSourceRef.current) return;

        const src = aptMarkerSourceRef.current;
        const OL = window.ol;

        src.clear();

        if (!analyzedApartments || analyzedApartments.length === 0) return;

        let isCancelled = false;
        const currentYear = new Date().getFullYear();

        const runSequentialGeocoding = async () => {
            for (const apt of analyzedApartments) {
                if (isCancelled) break;
                if (!apt?.jibun || !apt?.dongName) continue;

                const searchStr = `${apt.dongName} ${apt.jibun}`.trim();

                try {
                    let ageStr = '-년차';
                    if (apt.buildYear && String(apt.buildYear).length === 4) {
                        const bYear = parseInt(apt.buildYear, 10);
                        if (!Number.isNaN(bYear)) {
                            ageStr = `${currentYear - bYear + 1}년차`;
                        }
                    }

                    const item = await VWorldService.searchAddress(searchStr);

                    if (isCancelled) break;
                    if (!item?.point?.x || !item?.point?.y) continue;

                    const lon = parseFloat(item.point.x);
                    const lat = parseFloat(item.point.y);
                    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

                    const center3857 = OL.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                    const feature = new OL.Feature({
                        geometry: new OL.geom.Point(center3857)
                    });

                    const priceInEok = Number.isFinite(apt.avg) ? (apt.avg / 10000).toFixed(2) : '-';
                    const areaDisp = Number.isFinite(apt.avgArea) ? apt.avgArea.toFixed(1) : '-';

                    feature.setProperties({
                        aptName: apt.name || '-',
                        ageStr,
                        areaDisp,
                        priceInEok,
                        count: apt.count || 0,
                        layerType: 'aptMarker'
                    });

                    src.addFeature(feature);

                    await new Promise((resolve) => setTimeout(resolve, 120));
                } catch (e) {
                    console.warn('Map marker geocoding skipped for:', searchStr, e);
                }
            }
        };

        runSequentialGeocoding();

        return () => {
            isCancelled = true;
        };
    }, [analyzedApartments, mapObj]);

    // Unified Visibility Logic
    useEffect(() => {
        if (!mapObj) return;

        const allMapLayers = mapObj.getLayers().getArray();
        allMapLayers.forEach((layer) => {
            const name = layer.get('name');
            if (!name) return;

            // 1) Base Maps
            if (name === 'satellite') layer.setVisible(mapType === 'satellite');
            else if (name === 'base') layer.setVisible(mapType === 'base');
            else if (name === 'gray') layer.setVisible(mapType === 'gray');
            else if (name === 'midnight') layer.setVisible(mapType === 'midnight');
            
            // 2) Hybrid Labels
            else if (name === 'hybrid') layer.setVisible(mapType === 'satellite' && showHybrid);

            // 3) Cadastral & Other WMS Layers
            else if (name === 'LP_PA_CBND_BUBUN') {
                const isActive = activeLayers.includes(name);
                const currentZoom = mapObj.getView().getZoom();
                layer.setVisible(isActive && currentZoom >= 12);
            }
            else if (ALL_LAYERS.some(l => l.id === name)) {
                layer.setVisible(activeLayers.includes(name));
            }
        });
    }, [mapObj, mapType, showHybrid, activeLayers]);
    
    // Zoom Listener for Cadastral visibility update
    useEffect(() => {
        if (!mapObj) return;
        const handleZoomEnd = () => {
            const cadastralLayer = cadastralLayerRef.current;
            if (cadastralLayer) {
                const isActive = activeLayers.includes('LP_PA_CBND_BUBUN');
                const z = mapObj.getView().getZoom();
                cadastralLayer.setVisible(isActive && z >= 12);
            }
        };
        mapObj.on('moveend', handleZoomEnd);
        return () => mapObj.un('moveend', handleZoomEnd);
    }, [mapObj, activeLayers]);

    useEffect(() => {
        if (!mapObj) return;

        const cursorHoverHandler = (e) => {
            if (e.dragging) return;

            const pixel = mapObj.getEventPixel(e.originalEvent);
            const hitFeatures = [];

            mapObj.forEachFeatureAtPixel(pixel, (feature) => {
                if (feature.get('layerType') === 'aptMarker') {
                    hitFeatures.push(feature);
                }
            });

            const targetFeature = hitFeatures.length > 0 ? hitFeatures[0] : null;

            const src = aptMarkerSourceRef.current;
            if (src) {
                src.getFeatures().forEach((f) => {
                    const isHovered = f === targetFeature;
                    if (f.get('hovered') !== isHovered) {
                        f.set('hovered', isHovered);
                    }
                });
            }

            mapObj.getTargetElement().style.cursor = targetFeature ? 'pointer' : '';
        };

        mapObj.on('pointermove', cursorHoverHandler);

        return () => {
            mapObj.un('pointermove', cursorHoverHandler);
        };
    }, [mapObj]);

    useEffect(() => {
        if (!mapObj || !selectedAddress?.x || !selectedAddress?.y) return;

        try {
            const OL = window.ol;
            const x = parseFloat(selectedAddress.x);
            const y = parseFloat(selectedAddress.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;

            const center = OL.proj.transform([x, y], 'EPSG:4326', 'EPSG:3857');
            
            // Only move center, do not force zoom unless extremely zoomed out
            const currentZoom = mapObj.getView().getZoom();
            if (currentZoom < 14) {
                mapObj.getView()?.animate({ center, zoom: 16, duration: 500 });
            } else {
                mapObj.getView()?.animate({ center, duration: 500 });
            }
        } catch (e) {
            console.error('Map Update Error:', e);
        }
    }, [mapObj, selectedAddress]);

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
    }, [clearMeasurements, clearRadius, commitSelectedParcels, renderSingleFocus, setParcelPickMode]);

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
            <div
                id="vworld_map_target"
                className="w-full h-full absolute inset-0 z-0 bg-gray-200 outline-none"
                tabIndex="0"
            />

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
