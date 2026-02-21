import { useRef, useEffect } from 'react';

export const useRadiusDrawing = (mapObj, radiusMode, selectedAddress, selectedParcels) => {
    const radiusSourceRef = useRef(null);

    useEffect(() => {
        if (!mapObj || !window.ol) return;
        const OL = window.ol;

        if (!radiusSourceRef.current) {
            radiusSourceRef.current = new OL.source.Vector();
            const radiusLayer = new OL.layer.Vector({
                source: radiusSourceRef.current,
                zIndex: 22,
                style: (feature) => {
                    const type = feature.get('type');
                    if (type === 'circle') {
                        return new OL.style.Style({
                            stroke: new OL.style.Stroke({
                                color: 'rgba(239, 68, 68, 0.6)',
                                width: 2,
                                lineDash: [5, 5]
                            }),
                            fill: new OL.style.Fill({ color: 'rgba(239, 68, 68, 0.05)' })
                        });
                    }
                    if (type === 'label') {
                        return new OL.style.Style({
                            text: new OL.style.Text({
                                text: feature.get('text'),
                                font: 'bold 10px Inter, sans-serif',
                                fill: new OL.style.Fill({ color: '#ef4444' }),
                                stroke: new OL.style.Stroke({ color: '#fff', width: 2 }),
                                offsetY: -10
                            })
                        });
                    }
                }
            });
            mapObj.addLayer(radiusLayer);
        }
    }, [mapObj]);

    const toggleRadius = (active) => {
        if (!radiusSourceRef.current || !mapObj || !window.ol) return;
        const OL = window.ol;

        if (!active) {
            radiusSourceRef.current.clear();
            return;
        }

        radiusSourceRef.current.clear();

        // Find center
        let centerLng, centerLat;
        if (selectedAddress && (selectedAddress.x || selectedAddress.lon)) {
            centerLng = selectedAddress.x || selectedAddress.lon;
            centerLat = selectedAddress.y || selectedAddress.lat;
        } else if (selectedParcels && selectedParcels.length > 0) {
            const ext = selectedParcels[0].getGeometry().getExtent();
            const center3857 = OL.extent.getCenter(ext);
            const center4326 = OL.proj.transform(center3857, 'EPSG:3857', 'EPSG:4326');
            centerLng = center4326[0];
            centerLat = center4326[1];
        } else {
            const mapCenter = mapObj.getView().getCenter();
            const center4326 = OL.proj.transform(mapCenter, 'EPSG:3857', 'EPSG:4326');
            centerLng = center4326[0];
            centerLat = center4326[1];
        }

        if (!centerLng || !centerLat) return;

        const center3857 = OL.proj.transform([Number(centerLng), Number(centerLat)], 'EPSG:4326', 'EPSG:3857');
        const distances = [500, 1000, 1500, 3000, 5000, 10000];
        const labels = ['500m', '1km', '1.5km', '3km', '5km', '10km'];

        distances.forEach((dist, idx) => {
            const radius3857 = dist / Math.cos(Number(centerLat) * Math.PI / 180);
            const circleFeature = new OL.Feature({
                geometry: new OL.geom.Circle(center3857, radius3857),
                type: 'circle'
            });
            const labelFeature = new OL.Feature({
                geometry: new OL.geom.Point([center3857[0], center3857[1] + radius3857]),
                type: 'label',
                text: labels[idx]
            });
            radiusSourceRef.current.addFeature(circleFeature);
            radiusSourceRef.current.addFeature(labelFeature);
        });

        mapObj.getView().animate({ center: center3857, zoom: 12, duration: 800 });
    };

    return {
        toggleRadius,
        clearRadius: () => radiusSourceRef.current?.clear?.()
    };
};
