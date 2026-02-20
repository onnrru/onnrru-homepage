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

        // 1. Layers

        // (A) Base Map (VWorld Base - Gray/White style)
        const baseLayer = new OL.layer.Tile({
            source: new OL.source.XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${API_CONFIG.VWORLD_KEY}/Base/{z}/{y}/{x}.png`,
                attributions: 'VWorld',
                crossOrigin: 'anonymous'
            }),
            zIndex: 1
        });

        // (B) Overlay: Zoning (Bottom) -> Cadastral (Top)
        const wmsLayers = [
            'lt_c_uq111', // Urban
            'lt_c_uq112', // Management
            'lt_c_uq113', // Agri/Forest
            'lt_c_uq114', // Nature Conservation
            'lp_pa_cbnd_bubun' // Cadastral (Lines)
        ].join(',');

        const overlayLayer = new OL.layer.Tile({
            source: new OL.source.TileWMS({
                url: 'https://api.vworld.kr/req/wms',
                params: {
                    SERVICE: 'WMS',
                    REQUEST: 'GetMap',
                    VERSION: '1.3.0',
                    LAYERS: wmsLayers,
                    STYLES: wmsLayers,
                    CRS: 'EPSG:3857',
                    FORMAT: 'image/png',
                    TRANSPARENT: 'TRUE',
                    KEY: API_CONFIG.VWORLD_KEY,
                    DOMAIN: window.location.hostname
                }
            }),
            zIndex: 10,
            opacity: 0.85
        });

        // (C) Vector Layer (Target Polygon)
        const vectorSource = new OL.source.Vector();
        vectorSourceRef.current = vectorSource;
        const vectorLayer = new OL.layer.Vector({
            source: vectorSource,
            zIndex: 20,
            style: new OL.style.Style({
                stroke: new OL.style.Stroke({
                    color: '#ef4444', // Red
                    width: 3 // Thicker for Zoom 9
                }),
                fill: new OL.style.Fill({
                    color: 'rgba(239, 68, 68, 0.4)' // Stronger fill for Zoom 9
                })
            })
        });

        // 2. View
        // Fixed at Zoom 9 as requested (Very Wide View)
        const center = OL.proj.fromLonLat([Number(x), Number(y)]);

        const map = new OL.Map({
            target: mapRef.current,
            layers: [baseLayer, overlayLayer, vectorLayer],
            view: new OL.View({
                center: center,
                zoom: 9,
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
        map.getView().setZoom(9); // Force Zoom 9

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
