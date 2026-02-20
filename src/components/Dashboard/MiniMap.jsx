import React, { useEffect, useRef } from 'react';
import { API_CONFIG } from '../../config/api';

const MiniMap = ({ x, y }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

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

        // Marker (Center)
        const vectorSource = new OL.source.Vector();
        const vectorLayer = new OL.layer.Vector({
            source: vectorSource,
            zIndex: 20,
            style: new OL.style.Style({
                image: new OL.style.Circle({
                    radius: 6,
                    fill: new OL.style.Fill({ color: '#ef4444' }),
                    stroke: new OL.style.Stroke({ color: '#ffffff', width: 2 })
                })
            })
        });

        // 2. View
        // Initial center, will be updated
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
            controls: [] // No zoom controls etc
        });

        mapInstance.current = map;

        // Cleanup
        return () => {
            map.setTarget(null);
            mapInstance.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Init once

    // Update Center & Marker when Props change
    useEffect(() => {
        const OL = window.ol;
        const map = mapInstance.current;
        if (!map || !OL || !x || !y) return;

        const center = OL.proj.fromLonLat([Number(x), Number(y)]);
        map.getView().setCenter(center);

        // Update Marker
        const vectorLayer = map.getLayers().getArray().find(l => l instanceof OL.layer.Vector);
        if (vectorLayer) {
            const src = vectorLayer.getSource();
            src.clear();
            const feature = new OL.Feature({
                geometry: new OL.geom.Point(center)
            });
            src.addFeature(feature);
        }
    }, [x, y]);

    return (
        <div
            ref={mapRef}
            className="w-full h-full bg-white relative"
            style={{ backgroundColor: '#ffffff' }} // Force white background
        />
    );
};

export default MiniMap;
