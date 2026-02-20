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
        // Base: None (White background via CSS container)
        // Overlay: Cadastral
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
            zIndex: 10
        });

        // Vector Layer (Polygon or Marker)
        const vectorSource = new OL.source.Vector();
        vectorSourceRef.current = vectorSource;
        const vectorLayer = new OL.layer.Vector({
            source: vectorSource,
            zIndex: 20,
            style: new OL.style.Style({
                stroke: new OL.style.Stroke({
                    color: '#ef4444', // Red
                    width: 2
                }),
                fill: new OL.style.Fill({
                    color: 'rgba(239, 68, 68, 0.2)' // Transparent Red
                }),
                image: new OL.style.Circle({
                    radius: 5,
                    fill: new OL.style.Fill({ color: '#ef4444' }),
                    stroke: new OL.style.Stroke({ color: '#ffffff', width: 2 })
                })
            })
        });

        // 2. View
        // Initial center
        const center = OL.proj.fromLonLat([Number(x), Number(y)]);

        const map = new OL.Map({
            target: mapRef.current,
            layers: [cadastralLayer, vectorLayer],
            view: new OL.View({
                center: center,
                zoom: 19,
                minZoom: 19,
                maxZoom: 19,
                enableRotation: false
            }),
            controls: [] // No controls
        });

        mapInstance.current = map;

        // Cleanup
        return () => {
            map.setTarget(null);
            mapInstance.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Init once

    // Update Content
    useEffect(() => {
        const OL = window.ol;
        const map = mapInstance.current;
        const src = vectorSourceRef.current;
        if (!map || !OL || !src || !x || !y) return;

        const center = OL.proj.fromLonLat([Number(x), Number(y)]);
        map.getView().setCenter(center);

        src.clear();

        if (feature) {
            // Render Polygon
            const format = new OL.format.GeoJSON();
            const olFeature = format.readFeature(feature, {
                featureProjection: 'EPSG:3857',
                dataProjection: 'EPSG:4326'
            });
            src.addFeature(olFeature);
        } else {
            // Fallback: Point Marker
            const pointFeature = new OL.Feature({
                geometry: new OL.geom.Point(center)
            });
            src.addFeature(pointFeature);
        }

    }, [x, y, feature]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full bg-white relative"
            style={{ backgroundColor: '#ffffff' }}
        />
    );
};

export default MiniMap;
