import { useRef, useEffect } from 'react';

export const useMapMeasurements = (mapObj, measureMode) => {
    const measureTooltipElement = useRef(null);
    const measureTooltip = useRef(null);
    const helpTooltipElement = useRef(null);
    const helpTooltip = useRef(null);
    const measureSource = useRef(null);
    const drawInteraction = useRef(null);

    useEffect(() => {
        if (!mapObj || !window.ol) return;
        const OL = window.ol;

        // Ensure source exists
        if (!measureSource.current) {
            measureSource.current = new OL.source.Vector();
            const measureLayer = new OL.layer.Vector({
                source: measureSource.current,
                zIndex: 25,
                style: new OL.style.Style({
                    fill: new OL.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
                    stroke: new OL.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new OL.style.Circle({
                        radius: 7,
                        fill: new OL.style.Fill({ color: '#ffcc33' })
                    })
                })
            });
            mapObj.addLayer(measureLayer);
        }

        if (!measureMode) {
            if (drawInteraction.current) mapObj.removeInteraction(drawInteraction.current);
            return;
        }

        const type = measureMode === 'area' ? 'Polygon' : 'LineString';
        const draw = new OL.interaction.Draw({
            source: measureSource.current,
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
            measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-measure bg-black/70 text-white px-2 py-1 rounded text-xs';
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
                measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-static bg-black/70 text-white px-2 py-1 rounded text-xs border border-white/20 shadow-sm';
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

    return {
        clearMeasurements: () => {
            measureSource.current?.clear?.();
            document.querySelectorAll('.ol-tooltip-static')?.forEach((el) => el.remove());
        }
    };
};
