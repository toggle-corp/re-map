import React, { useContext, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import produce from 'immer';

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

    geoJSON?: GeoJSON.Feature<GeoJSON.Geometry>
    | GeoJSON.FeatureCollection<GeoJSON.Geometry>
    | string;
}

const MapSource = (props: Props) => {
    const {
        sourceOptions,
        sourceKey,
        geoJSON,
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
    } = useContext(MapChildContext);

    const [forceUpdate] = useCounter(0);
    const [initialGeoJSON] = useState(geoJSON);
    const [initialSourceOptions] = useState(sourceOptions);

    // Add source in mapboxgl and notify addition to parent
    useEffect(
        () => {
            if (!map || !sourceKey || !mapStyle) {
                return noop;
            }

            const options = initialSourceOptions.type === 'geojson'
                ? { ...initialSourceOptions, data: initialGeoJSON }
                : initialSourceOptions;

            console.warn(`Creating new source: ${sourceKey}`);
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
            initialGeoJSON, initialSourceOptions,
        ],
    );

    // Handle geoJSON change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !geoJSON || !mapStyle) {
                return;
            }
            const source = map.getSource(sourceKey);
            // FIXME: avoid redundant call to this effect
            if (source.type === 'geojson') {
                console.warn(`Setting source geojson: ${sourceKey}`);
                source.setData(geoJSON);
            }
        },
        [map, mapStyle, sourceKey, geoJSON],
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
            // console.warn(`Registering layer: ${layerKey}`);
            const newSource = produce(source, (safeSource) => {
                // eslint-disable-next-line no-param-reassign
                delete safeSource.layers[layerKey];
            });

            if (map) {
                console.warn(`Removing layer: ${layerKey}`);
                map.removeLayer(layerKey);
            }

            setSource(newSource);
        },
        [map, sourceKey, getSource, setSource],
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
        isMapDestroyed,
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
