import React, { useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MiniMap = ({ x, y, feature }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const vectorSourceRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;
        const OL = window.ol;
        if (!OL) {
            console.error("OpenLayers not found");
            return;
        }

        // 1. Base Layer: White Map (Background)
        const baseLayer = new OL.layer.Tile({
            source: new OL.source.XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${API_CONFIG.VWORLD_KEY}/white/{z}/{y}/{x}.png`,
                attributions: 'VWorld',
                crossOrigin: 'anonymous'
            }),
            zIndex: 0
        });

        // 2. Zoning Layers (Middle)
        // Urban, Management, Agri/Forest
        const zoningLayers = [
            'lt_c_uq111', // Urban Area
            'lt_c_uq112', // Management Area
            'lt_c_uq113'  // Agri/Forest Area
        ].join(',');

        const zoningWmsLayer = new OL.layer.Tile({
            source: new OL.source.TileWMS({
                url: 'https://api.vworld.kr/req/wms',
                params: {
                    SERVICE: 'WMS',
                    REQUEST: 'GetMap',
                    VERSION: '1.3.0',
                    LAYERS: zoningLayers,
                    STYLES: zoningLayers,
                    CRS: 'EPSG:3857',
                    FORMAT: 'image/png',
                    TRANSPARENT: 'TRUE',
                    KEY: API_CONFIG.VWORLD_KEY,
                    DOMAIN: window.location.hostname
                }
            }),
            zIndex: 10, // Above Base
            opacity: 0.7
        });

        // 3. Cadastral Layer (Top of Map Layers)
        // Separate layer to ensure lines render ON TOP of zoning colors
        const cadastralLayer = new OL.layer.Tile({
            source: new OL.source.TileWMS({
                url: 'https://api.vworld.kr/req/wms',
                params: {
                    SERVICE: 'WMS',
                    REQUEST: 'GetMap',
                    VERSION: '1.3.0',
                    LAYERS: 'lp_pa_cbnd_bubun',
                    STYLES: 'lp_pa_cbnd_bubun',
                    CRS: 'EPSG:3857',
                    FORMAT: 'image/png',
                    TRANSPARENT: 'TRUE',
                    KEY: API_CONFIG.VWORLD_KEY,
                    DOMAIN: window.location.hostname
                }
            }),
            zIndex: 20, // Above Zoning
            opacity: 1.0
        });

        // 4. Vector Selection (Highest Priority)
        const vectorSource = new OL.source.Vector();
        vectorSourceRef.current = vectorSource;
        const vectorLayer = new OL.layer.Vector({
            source: vectorSource,
            zIndex: 30, // Max Z-Index
            style: new OL.style.Style({
                stroke: new OL.style.Stroke({
                    color: '#ef4444', // Red
                    width: 3
                }),
                fill: new OL.style.Fill({
                    color: 'rgba(239, 68, 68, 0.4)'
                })
            })
        });

        // View: Zoom 10 (Max zoom-out where cadastral lines typically remain visible)
        // VWorld Cadastral works 6-19, but 10 is a good "District" level view.
        const center = OL.proj.fromLonLat([Number(x), Number(y)]);

        const map = new OL.Map({
            target: mapRef.current,
            layers: [baseLayer, zoningWmsLayer, cadastralLayer, vectorLayer],
            view: new OL.View({
                center: center,
                zoom: 10,
                minZoom: 6,
                maxZoom: 19,
                enableRotation: false
            }),
            controls: []
        });

        mapInstance.current = map;

        return () => {
            map.setTarget(null);
            mapInstance.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update Content
    useEffect(() => {
        const OL = window.ol;
        const map = mapInstance.current;
        const src = vectorSourceRef.current;
        if (!map || !OL || !src || !x || !y) return;

        const center = OL.proj.fromLonLat([Number(x), Number(y)]);
        map.getView().setCenter(center);
        map.getView().setZoom(10); // Force Zoom 10

        src.clear();

        if (feature) {
            const format = new OL.format.GeoJSON();
            try {
                const olFeature = format.readFeature(feature, {
                    featureProjection: 'EPSG:3857',
                    dataProjection: 'EPSG:4326'
                });
                src.addFeature(olFeature);
            } catch (e) {
                // Feature might be invalid or not GeoJSON
            }
        }
    }, [x, y, feature]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full bg-white relative"
        />
    );
};

export default MiniMap;
