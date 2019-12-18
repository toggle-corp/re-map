import { useContext, useEffect } from 'react';
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
}

const MapLayer = (props: Props) => {
    const {
        layerKey,
        layerOptions,
        onClick,
        onDoubleClick,
        onMouseEnter,
        onMouseLeave,
    } = props;

    const {
        map,
        mapStyle,

        sourceKey,

        setLayer,
        removeLayer,
        getLayer,
    } = useContext(SourceChildContext);

    // TODO: update onClick, disabled on change

    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return noop;
            }
            const id = getLayerName(sourceKey, layerKey);
            console.warn(`Creating new layer: ${id}`);
            map.addLayer({
                ...layerOptions,
                id,
                source: sourceKey,
            });

            const destroy = () => {
                const layer = getLayer(layerKey);
                if (!layer) {
                    // console.error(`No layer named: ${id}`);
                    return;
                }
                removeLayer(id);
            };

            setLayer({
                name: layerKey,
                destroy,
                onClick,
                onDoubleClick,
                onMouseEnter,
                onMouseLeave,
            });

            return destroy;
        },
        [map, mapStyle, sourceKey, layerKey],
    );

    const {
        paint,
        filter,
        layout,
    } = layerOptions;

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
        [paint],
    );

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
        [layout],
    );

    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey || !filter) {
                return;
            }
            const id = getLayerName(sourceKey, layerKey);
            map.setFilter(id, filter);
        },
        [filter],
    );

    return null;
};


MapLayer.defaultProps = {
};

export default MapLayer;
