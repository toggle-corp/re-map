import {
    useContext, useEffect, useState, useRef,
} from 'react';
import mapboxgl from 'mapbox-gl';

import { getLayerName } from '../utils';
import { SourceChildContext } from '../context';
import { Dragging } from '../type';
// import { Layer } from '../type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

function removeUndefined<T extends object>(obj: T) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanNewLayerOptions: any = {};
    Object.keys(obj).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (key && (obj as any)[key]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cleanNewLayerOptions[key] = (obj as any)[key];
        }
    });
    return cleanNewLayerOptions as T;
}

interface Props {
    layerKey: string;
    layerOptions: Omit<Exclude<mapboxgl.AnyLayer, mapboxgl.CustomLayerInterface>, 'id'>;
    hoverable?: boolean;
    onClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => boolean | undefined;
    onDoubleClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => boolean | undefined;
    // Only called for topmost layer
    onMouseEnter?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
    onMouseLeave?: (map: mapboxgl.Map) => void;
    beneath?: string;
    onAnimationFrame?: (timestamp: number) => mapboxgl.AnyPaint | undefined;
    onDrag?: (
        feature: Dragging,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
    onDragEnd?: (
        feature: Dragging,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
}

function MapLayer(props: Props) {
    const {
        layerKey,
        layerOptions,
        onClick,
        onDoubleClick,
        onMouseEnter,
        onDrag,
        onDragEnd,
        onMouseLeave,
        beneath,
        onAnimationFrame,
        hoverable = false,
    } = props;

    const {
        map,
        mapStyle,

        sourceKey,

        setLayer,
        removeLayer,
        getLayer,

        managed: initialManaged,
        debug,
    } = useContext(SourceChildContext);

    const [initialLayerOptions] = useState(layerOptions);
    const [initialBeneath] = useState(beneath);
    const [initialDebug] = useState(debug);

    const animationKeyRef = useRef<number | undefined>();

    // Add layer in mapboxgl
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return noop;
            }
            const id = getLayerName(sourceKey, layerKey, initialManaged);

            if (initialDebug) {
                // eslint-disable-next-line no-console
                console.warn(`Creating new layer: ${id}`);
            }

            if (initialManaged) {
                const newLayerOptions = removeUndefined({
                    ...initialLayerOptions,
                    id,
                    source: sourceKey,
                } as Exclude<mapboxgl.AnyLayer, mapboxgl.CustomLayerInterface>);
                map.addLayer(
                    newLayerOptions,
                    initialBeneath,
                );
            }

            const destroy = () => {
                const layer = getLayer(layerKey);
                if (!layer) {
                    // console.error(`No layer named: ${id}`);
                    return;
                }
                removeLayer(layerKey);
            };

            setLayer(
                layerKey,
                () => ({
                    name: layerKey,
                    destroy,
                }),
            );

            return destroy;
        },
        [
            map, mapStyle, sourceKey, layerKey,
            initialLayerOptions, initialBeneath, initialDebug,
            initialManaged,
            getLayer, removeLayer, setLayer,
        ],
    );

    // Notify modification on layer
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return;
            }
            setLayer(
                layerKey,
                (layer) => layer && ({
                    ...layer,
                    hoverable,
                    onClick,
                    onDoubleClick,
                    onMouseEnter,
                    onMouseLeave,
                    onDrag,
                    onDragEnd,
                }),
            );
        },
        [
            map, sourceKey, layerKey,
            hoverable,
            onClick, onDoubleClick, onMouseEnter, onMouseLeave,
            onDrag, onDragEnd,
            setLayer,
        ],
    );

    const {
        paint,
        filter,
        layout,
    } = layerOptions;

    // Handle paint change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !paint) {
                return;
            }
            const id = getLayerName(sourceKey, layerKey, initialManaged);
            Object.entries(paint).forEach(([key, value]) => {
                map.setPaintProperty(id, key, value);
            });
        },
        [map, sourceKey, layerKey, paint, initialManaged],
    );

    // Handle layout change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !layout) {
                return;
            }
            const id = getLayerName(sourceKey, layerKey, initialManaged);
            Object.entries(layout).forEach(([key, value]) => {
                map.setLayoutProperty(id, key, value);
            });
        },
        [map, sourceKey, layerKey, layout, initialManaged],
    );

    // Handle filter change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return;
            }
            const id = getLayerName(sourceKey, layerKey, initialManaged);
            map.setFilter(id, filter);
        },
        [map, sourceKey, layerKey, filter, initialManaged],
    );

    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !onAnimationFrame) {
                return noop;
            }

            const handleAnimation = (timestamp: number) => {
                const values = onAnimationFrame(timestamp);
                if (values) {
                    const id = getLayerName(sourceKey, layerKey, initialManaged);
                    Object.entries(values).forEach(([key, value]) => {
                        map.setPaintProperty(id, key, value);
                    });
                }

                animationKeyRef.current = requestAnimationFrame(handleAnimation);
            };

            animationKeyRef.current = requestAnimationFrame(handleAnimation);

            return () => {
                if (animationKeyRef.current) {
                    cancelAnimationFrame(animationKeyRef.current);
                }
            };
        },
        [map, sourceKey, layerKey, onAnimationFrame, initialManaged],
    );

    return null;
}

export default MapLayer;
