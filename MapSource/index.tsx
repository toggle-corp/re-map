import React, { useContext, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import produce from 'immer';

import { getLayerName } from '../utils';
import { MapChildContext, SourceChildContext } from '../context';
import { Layer } from '../type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

function useCounter(initialValue = 0): [() => void, number] {
    const [value, updateValue] = useState(initialValue);
    const increaseValue = useCallback(() => {
        updateValue(v => v + 1);
    }, []);
    return [increaseValue, value];
}

interface Props {
    children?: React.ReactNode | null; // FIXME typings
    sourceOptions: mapboxgl.AnySourceData;
    sourceKey: string;

    geoJson?: GeoJSON.Feature<GeoJSON.Geometry>
    | GeoJSON.FeatureCollection<GeoJSON.Geometry>
    | string;
}

const MapSource = (props: Props) => {
    const {
        sourceOptions,
        sourceKey,
        geoJson,
        children,
    } = props;

    const {
        map,
        mapStyle,
        setSource,
        getSource,
        removeSource,
        isSourceDefined,
        isMapDestroyed,
        debug,
    } = useContext(MapChildContext);

    const [initialDebug] = useState(debug);
    const [forceUpdate] = useCounter(0);
    const [initialGeoJson] = useState(geoJson);
    const [initialSourceOptions] = useState(sourceOptions);

    // Add source in mapboxgl and notify addition to parent
    useEffect(
        () => {
            if (!map || !sourceKey || !mapStyle) {
                return noop;
            }

            const options = initialSourceOptions.type === 'geojson'
                ? { ...initialSourceOptions, data: initialGeoJson }
                : initialSourceOptions;

            if (initialDebug) {
                console.warn(`Creating new source: ${sourceKey}`);
            }
            map.addSource(sourceKey, options);

            const destroy = () => {
                const source = getSource(sourceKey);
                if (!source) {
                    // console.error(`No source named: ${sourceKey}`);
                    return;
                }

                Object.entries(source.layers).forEach(([_, layer]) => {
                    layer.destroy();
                });
                removeSource(sourceKey);
            };

            setSource({ name: sourceKey, destroy, layers: {} });
            forceUpdate();

            return destroy;
        },
        [
            map, mapStyle, sourceKey,
            forceUpdate,
            getSource, removeSource, setSource,
            initialGeoJson, initialSourceOptions, initialDebug,
        ],
    );

    // Handle geoJson change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !geoJson || !mapStyle) {
                return;
            }
            const source = map.getSource(sourceKey);
            // FIXME: avoid redundant call to this effect
            if (source.type === 'geojson') {
                if (initialDebug) {
                    console.warn(`Setting source geojson: ${sourceKey}`);
                }
                source.setData(geoJson);
            }
        },
        [map, mapStyle, sourceKey, geoJson, initialDebug],
    );

    const getLayer = useCallback(
        (layerKey: string) => {
            const source = getSource(sourceKey);
            if (!source) {
                return undefined;
            }
            return source.layers[layerKey];
        },
        [sourceKey, getSource],
    );

    const setLayer = useCallback(
        (name: string, method: (l: Layer | undefined) => (Layer | undefined)) => {
            // const { name } = layer;
            const source = getSource(sourceKey);
            if (!source) {
                console.error(`No source named: ${sourceKey}`);
                return;
            }
            // console.warn(`Registering layer: ${name}`);
            const newSource = produce(source, (safeSource) => {
                const value = method(source.layers[name]);
                if (value !== undefined) {
                    // eslint-disable-next-line no-param-reassign
                    safeSource.layers[name] = value;
                } else {
                    // eslint-disable-next-line no-param-reassign
                    delete safeSource.layers[name];
                }
            });
            setSource(newSource);
        },
        [sourceKey, getSource, setSource],
    );

    const removeLayer = useCallback(
        (layerKey: string) => {
            const source = getSource(sourceKey);
            if (!source) {
                console.error(`No source named: ${sourceKey}`);
                return;
            }

            const layer = source.layers[layerKey];
            if (!layer) {
                console.error(`No layer named: ${layerKey}`, source);
                return;
            }

            // NOTE: check if map is dis-mounted?
            if (map) {
                const id = getLayerName(sourceKey, layerKey);
                if (initialDebug) {
                    console.warn(`Removing layer: ${id}`);
                }
                map.removeLayer(id);
            }

            // console.warn(`Registering layer: ${layerKey}`);
            const newSource = produce(source, (safeSource) => {
                // eslint-disable-next-line no-param-reassign
                delete safeSource.layers[layerKey];
            });

            setSource(newSource);
        },
        [map, sourceKey, getSource, setSource, initialDebug],
    );

    if (!isSourceDefined(sourceKey)) {
        return null;
    }

    const childrenProps = {
        map,
        mapStyle,
        sourceKey,
        getLayer,
        setLayer,
        removeLayer,
        isSourceDefined,
        isMapDestroyed,
        debug: initialDebug,
    };

    return (
        <SourceChildContext.Provider value={childrenProps}>
            {children}
        </SourceChildContext.Provider>
    );
};


MapSource.defaultProps = {
};

export default MapSource;
