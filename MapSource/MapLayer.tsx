import { useContext, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import { getLayerName } from '../utils';
import { SourceChildContext } from '../context';
// import { Layer } from '../type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props {
    layerKey: string;
    layerOptions: mapboxgl.Layer;
    onClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
    ) => boolean | undefined;
    onDoubleClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
    ) => boolean | undefined;
    // Only called for topmost layer
    onMouseEnter?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
    ) => void;
    onMouseLeave?: () => void;
    beneath?: string;
}

const MapLayer = (props: Props) => {
    const {
        layerKey,
        layerOptions,
        onClick,
        onDoubleClick,
        onMouseEnter,
        onMouseLeave,
        beneath,
    } = props;

    const [initialLayerOptions] = useState(layerOptions);
    const [initialBeneath] = useState(beneath);

    const {
        map,
        mapStyle,

        sourceKey,

        setLayer,
        removeLayer,
        getLayer,
    } = useContext(SourceChildContext);

    // Add layer in mapboxgl
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return noop;
            }
            const id = getLayerName(sourceKey, layerKey);
            // console.warn(`Creating new layer: ${id}`);

            const newLayerOptions = {
                ...initialLayerOptions,
                id,
                source: sourceKey,
            };

            const cleanNewLayerOptions = {};

            Object.keys(newLayerOptions).forEach((key) => {
                if (key && newLayerOptions[key]) {
                    cleanNewLayerOptions[key] = newLayerOptions[key];
                }
            });

            // console.warn(newLayerOptions);

            map.addLayer(
                cleanNewLayerOptions,
                initialBeneath,
            );

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
            initialLayerOptions, initialBeneath,
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
                layer => layer && ({
                    ...layer,
                    onClick,
                    onDoubleClick,
                    onMouseEnter,
                    onMouseLeave,
                }),
            );
        },
        [
            map, sourceKey, layerKey,
            onClick, onDoubleClick, onMouseEnter, onMouseLeave,
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
            const id = getLayerName(sourceKey, layerKey);
            Object.entries(paint).forEach(([key, value]) => {
                map.setPaintProperty(id, key, value);
            });
        },
        [map, sourceKey, layerKey, paint],
    );

    // Handle layout change
    // TODO: dont' call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !layout) {
                return;
            }
            const id = getLayerName(sourceKey, layerKey);
            Object.entries(layout).forEach(([key, value]) => {
                map.setLayoutProperty(id, key, value);
            });
        },
        [map, sourceKey, layerKey, layout],
    );

    // Handle filter change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !filter) {
                return;
            }
            // console.warn('filter', filter);
            const id = getLayerName(sourceKey, layerKey);
            map.setFilter(id, filter);
        },
        [map, sourceKey, layerKey, filter],
    );

    return null;
};


MapLayer.defaultProps = {
};

export default MapLayer;
