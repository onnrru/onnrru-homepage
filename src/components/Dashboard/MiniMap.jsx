import React, { useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MiniMap = ({ x, y, features }) => {
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

        const proxyUrl = API_CONFIG.VWORLD_BASE_URL; // '/api/vworld'

        // 1. Base Layer: White Map (Background)
        const baseLayer = new OL.layer.Tile({
            source: new OL.source.XYZ({
                url: `${proxyUrl}/req/wmts/1.0.0/${API_CONFIG.VWORLD_KEY}/white/{z}/{y}/{x}.png`,
                attributions: 'VWorld',
                crossOrigin: 'anonymous'
            }),
            zIndex: 0
        });

        // 2. Zoning Layers (Middle)
        // Urban, Management, Agri/Forest, Nature Conservation
        const zoningLayers = [
            'lt_c_uq111', // Urban Area
            'lt_c_uq112', // Management Area
            'lt_c_uq113', // Agri/Forest Area
            'lt_c_uq114'  // Nature Conservation
        ].join(',');

        const zoningWmsLayer = new OL.layer.Tile({
            source: new OL.source.TileWMS({
                url: `${proxyUrl}/req/wms`,
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
            zIndex: 10,
            opacity: 0.7
        });

        // 3. Vector Selection (Highest Priority)
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

        // View: Zoom 15 (Standard "Site View")
        const center = OL.proj.fromLonLat([Number(x), Number(y)]);

        const map = new OL.Map({
            target: mapRef.current,
            layers: [baseLayer, zoningWmsLayer, vectorLayer], // No Cadastral
            view: new OL.View({
                center: center,
                zoom: 15,
                minZoom: 10,
                maxZoom: 19,
                enableRotation: false
            }),
            controls: [], // No Zoom/Attr controls
            interactions: [] // Static (No Pan/Zoom/Drag)
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
        // Force Zoom 15 just in case
        map.getView().setZoom(15);

        src.clear();

        if (features && features.length > 0) {
            const format = new OL.format.GeoJSON();
            let added = false;
            features.forEach(feat => {
                if (!feat) return;
                try {
                    const olFeature = format.readFeature(feat, {
                        featureProjection: 'EPSG:3857',
                        dataProjection: 'EPSG:4326'
                    });
                    src.addFeature(olFeature);
                    added = true;
                } catch (e) { }
            });

            if (added) {
                const extent = src.getExtent();
                if (!OL.extent.isEmpty(extent)) {
                    map.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 16, duration: 400 });
                }
            }
        }
    }, [x, y, features]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full bg-white relative pointer-events-none" // Extra safety to disable interactions
        />
    );
};

export default MiniMap;
