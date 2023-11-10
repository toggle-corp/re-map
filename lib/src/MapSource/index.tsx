import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    useMemo,
} from 'react';
import {
    type SourceSpecification,
    type GeoJSONSourceSpecification,
    type LngLatLike,
    Marker,
} from 'maplibre-gl';
import { Obj } from '@togglecorp/fujs';

import { getLayerName, isGeoJSONSourceSpecification, isGeoJSONSource } from '../utils';
import { MapChildContext, SourceChildContext } from '../context';
import { Layer } from '../type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type ModifiedSourceSpecification = Exclude<SourceSpecification, GeoJSONSourceSpecification> | Omit<GeoJSONSourceSpecification, 'data'>;

function useCounter(initialValue = 0): [() => void, number] {
    const [value, updateValue] = useState(initialValue);
    const increaseValue = useCallback(() => {
        updateValue((v) => v + 1);
    }, []);
    return [increaseValue, value];
}

type Props = {
    children?: React.ReactNode | null; // FIXME typings
    sourceKey: string;
    createMarkerElement?: (properties: Record<string, unknown>) => HTMLElement;
} & ({
    managed: false;
    sourceOptions?: undefined;
    geoJson?: undefined;
} | {
    managed?: true;
    sourceOptions: ModifiedSourceSpecification;
    // FIXME: do we need a separate geojson field?
    geoJson?: GeoJSON.Feature<GeoJSON.Geometry>
    | GeoJSON.FeatureCollection<GeoJSON.Geometry>
    | string;
})

function MapSource(props: Props) {
    const {
        sourceKey,
        children,
        geoJson,
        sourceOptions,
        createMarkerElement,
        managed = true,
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
    const [initialManaged] = useState(managed);

    // Add source in maplibregl and notify addition to parent
    useEffect(
        () => {
            if (!map || !sourceKey || !mapStyle) {
                return noop;
            }

            if (initialDebug) {
                // eslint-disable-next-line no-console
                console.warn(`Creating new source: ${sourceKey}`, initialSourceOptions);
            }

            if (initialManaged && initialSourceOptions) {
                const options = isGeoJSONSourceSpecification(initialSourceOptions)
                    ? { ...initialSourceOptions, data: initialGeoJson }
                    : initialSourceOptions;

                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.warn(`Using options for new source: ${sourceKey}`, options);
                }
                try {
                    map.addSource(sourceKey, options);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            }

            const destroy = () => {
                const source = getSource(sourceKey);
                if (!source) {
                    // console.error(`No source named: ${sourceKey}`);
                    return;
                }

                Object.entries(source.layers).forEach(([, layer]) => {
                    layer.destroy();
                });
                removeSource(sourceKey);
            };

            setSource({
                name: sourceKey,
                destroy,
                layers: {},
                managed: initialManaged,
            });
            forceUpdate();

            return destroy;
        },
        [
            map, mapStyle, sourceKey,
            forceUpdate,
            getSource, removeSource, setSource,
            initialGeoJson, initialSourceOptions,
            initialDebug, initialManaged,
        ],
    );

    // Handle geoJson change
    // TODO: don't call in first render
    useEffect(
        () => {
            if (!map || !sourceKey || !geoJson || !mapStyle || !initialManaged) {
                return;
            }
            const source = map.getSource(sourceKey);

            if (source && isGeoJSONSource(source)) {
                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.warn(`Setting source geojson: ${sourceKey}`);
                }
                source.setData(geoJson);
            }
        },
        [map, mapStyle, sourceKey, geoJson, initialGeoJson, initialDebug, initialManaged],
    );

    const markers = useRef<Obj<Marker>>({});
    const markersOnScreen = useRef<Obj<Marker>>({});

    const updateMarkers = useCallback(
        () => {
            if (!map || !createMarkerElement || !sourceKey) {
                return;
            }
            const newMarkers: Obj<Marker> = {};
            const features = map.querySourceFeatures(sourceKey);

            features.forEach((feature) => {
                if (feature.geometry.type !== 'Point') {
                    return;
                }
                const {
                    geometry: {
                        coordinates,
                    },
                    properties,
                } = feature;
                if (!properties || !properties.cluster) {
                    return;
                }
                const { cluster_id: clusterId } = properties;

                let marker = markers.current[clusterId];
                if (!marker) {
                    const el = createMarkerElement(properties);
                    marker = new Marker({
                        element: el,
                    }).setLngLat(coordinates as LngLatLike);

                    markers.current[clusterId] = marker;
                }
                newMarkers[clusterId] = marker;

                if (!markersOnScreen.current[clusterId]) {
                    marker.addTo(map);
                }
            });

            Object.keys(markersOnScreen.current).forEach((markerId) => {
                if (!newMarkers[markerId]) {
                    markersOnScreen.current[markerId].remove();
                }
            });

            markersOnScreen.current = newMarkers;
        },
        [map, createMarkerElement, sourceKey],
    );

    useEffect(
        () => {
            if (!map || !sourceKey || !mapStyle || !geoJson || !createMarkerElement) {
                return noop;
            }

            map.on('move', updateMarkers);
            map.on('moveend', updateMarkers);

            return () => {
                // map.off('data', handleData);
                map.off('move', updateMarkers);
                map.off('moveend', updateMarkers);
            };
        },
        [map, sourceKey, mapStyle, createMarkerElement, updateMarkers, geoJson],
    );

    useEffect(
        () => {
            if (!map || !sourceKey || !mapStyle || !geoJson || !createMarkerElement) {
                return noop;
            }

            const interval = setInterval(updateMarkers, 1000);

            return () => {
                clearInterval(interval);
            };
        },
        [map, sourceKey, mapStyle, createMarkerElement, updateMarkers, geoJson],
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
                // eslint-disable-next-line no-console
                console.error(`No source named: ${sourceKey}`);
                return;
            }
            // console.warn(`Registering layer: ${name}`);
            let newSource;
            const value = method(source.layers[name]);
            if (value !== undefined) {
                newSource = {
                    ...source,
                    layers: {
                        ...source.layers,
                        [name]: value,
                    },
                };
            } else {
                newSource = {
                    ...source,
                    layers: {
                        ...source.layers,
                    },
                };
                delete newSource.layers[name];
            }
            setSource(newSource);
        },
        [sourceKey, getSource, setSource],
    );

    const removeLayer = useCallback(
        (layerKey: string) => {
            const source = getSource(sourceKey);
            if (!source) {
                // eslint-disable-next-line no-console
                console.error(`No source named: ${sourceKey}`);
                return;
            }

            const layer = source.layers[layerKey];
            if (!layer) {
                // eslint-disable-next-line no-console
                console.error(`No layer named: ${layerKey}`, source);
                return;
            }

            // NOTE: check if map is dis-mounted?
            if (map && source.managed) {
                const id = getLayerName(sourceKey, layerKey, source.managed);
                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.warn(`Removing layer: ${id}`);
                }
                map.removeLayer(id);
            }

            const newSource = {
                ...source,
                layers: {
                    ...source.layers,
                },
            };
            delete newSource.layers[layerKey];

            setSource(newSource);
        },
        [map, sourceKey, getSource, setSource, initialDebug],
    );

    const childrenProps = useMemo(
        () => ({
            map,
            mapStyle,
            sourceKey,
            getLayer,
            setLayer,
            removeLayer,
            isSourceDefined,
            isMapDestroyed,
            managed: initialManaged,
            debug: initialDebug,
        }),
        [
            map,
            mapStyle,
            sourceKey,
            getLayer,
            setLayer,
            removeLayer,
            isSourceDefined,
            isMapDestroyed,
            initialDebug,
            initialManaged,
        ],
    );

    if (!isSourceDefined(sourceKey)) {
        return null;
    }

    return (
        <SourceChildContext.Provider value={childrenProps}>
            {children}
        </SourceChildContext.Provider>
    );
}

export default MapSource;
