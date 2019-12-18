import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import produce from 'immer';

import { getLayerName } from './utils';
import { Layer, Sources, Source } from './type';
import { MapChildContext } from './context';

const UNSUPPORTED_BROWSER = !mapboxgl.supported();
const { REACT_APP_MAPBOX_ACCESS_TOKEN: TOKEN } = process.env;
if (TOKEN) {
    mapboxgl.accessToken = TOKEN;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/*
<MapState
    'under MapSource'
    'map-layer for tile'
    'name of state'
    'data'
*/

interface Props {
    mapStyle: mapboxgl.MapboxOptions['style'];
    mapOptions: Omit<mapboxgl.MapboxOptions, 'style' | 'container'>;

    scaleControlShown: boolean;
    scaleControlPosition?: Position;
    scaleControlOptions?: ConstructorParameters<typeof mapboxgl.ScaleControl>[0];

    navControlShown: boolean;
    navControlPosition?: Position;
    navControlOptions?: ConstructorParameters<typeof mapboxgl.NavigationControl>[0];
}

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';


const Map: React.FC<Props> = (props) => {
    const {
        mapStyle: mapStyleFromProps,
        mapOptions,

        scaleControlPosition,
        scaleControlShown,
        scaleControlOptions,

        navControlShown,
        navControlOptions,
        navControlPosition,
    } = props;
    const [mapStyle, setMapStyle] = useState<mapboxgl.MapboxOptions['style']>(undefined);
    const [loaded, setLoaded] = useState<boolean>(false);

    const sourcesRef = useRef<Sources>({});

    interface LastIn {
        id: string | number | undefined;
        layerName: string;
        sourceName: string;
        sourceLayer: string | undefined;
    }

    const lastIn = useRef<LastIn | undefined>(undefined);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | undefined>(undefined);

    useEffect(
        () => {
            if (UNSUPPORTED_BROWSER) {
                console.error('No Mapboxgl support.');
                return noop;
            }
            const { current: mapContainer } = mapContainerRef;
            if (!mapContainer) {
                console.error('No container found.');
                return noop;
            }

            const mapboxglMap = new mapboxgl.Map({
                container: mapContainer,
                style: mapStyleFromProps,
                preserveDrawingBuffer: true,
                ...mapOptions,
            });

            mapRef.current = mapboxglMap;
            console.warn('Creating new map');

            function getLayersForSources(sources: Sources) {
                const layers = Object.entries(sources)
                    .filter(([_, source]) => !!source.layers)
                    .map(([sourceKey, source]) => (
                        Object.entries(source.layers)
                            .map(([layerKey, layer]) => ({
                                ...layer,
                                sourceKey,
                                layerKey: getLayerName(sourceKey, layerKey),
                            }))
                    ))
                    .flat();
                return layers;
            }

            interface ExtendedLayer extends Layer {
                layerKey: string;
                sourceKey: string;
            }
            function findLayerFromLayers(layers: ExtendedLayer[], layerKey: string) {
                const layer = layers.find(l => l.layerKey === layerKey);
                return layer;
            }

            const handleClick = (data: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
                if (!mapRef.current) {
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);

                const {
                    point,
                    lngLat,
                } = data;

                const clickableLayerKeys = layers
                    .filter(layer => !!layer.onClick)
                    .map(layer => layer.layerKey);

                const clickableFeatures = mapRef.current.queryRenderedFeatures(
                    point,
                    { layers: clickableLayerKeys },
                );

                if (clickableFeatures.length <= 0) {
                    console.warn('No clickable layer found.');
                    // TODO: add a global handler
                    return;
                }
                clickableFeatures.every((clickableFeature) => {
                    const { layer: { id } } = clickableFeature;

                    const layer = findLayerFromLayers(layers, id);
                    if (layer && layer.onClick) {
                        return !layer.onClick(clickableFeature, lngLat, point);
                    }
                    return false;
                });
            };

            const handleDoubleClick = (data: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
                if (!mapRef.current) {
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);

                const {
                    point,
                    lngLat,
                } = data;

                const clickableLayerKeys = layers
                    .filter(layer => !!layer.onDoubleClick)
                    .map(layer => layer.layerKey);

                const clickableFeatures = mapRef.current.queryRenderedFeatures(
                    point,
                    { layers: clickableLayerKeys },
                );

                if (clickableFeatures.length <= 0) {
                    console.warn('No clickable layer found.');
                    // TODO: add a global handler
                    return;
                }
                clickableFeatures.every((clickableFeature) => {
                    const { layer: { id } } = clickableFeature;

                    const layer = findLayerFromLayers(layers, id);
                    if (layer && layer.onDoubleClick) {
                        return !layer.onDoubleClick(clickableFeature, lngLat, point);
                    }
                    return false;
                });
            };

            const handleMouseMove = (data: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
                if (!mapRef.current) {
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);

                const {
                    point,
                    lngLat,
                } = data;

                const interactiveLayerKeys = layers
                    .filter(layer => !!layer.onClick || !!layer.onDoubleClick)
                    .map(layer => layer.layerKey);
                const interactiveFeatures = mapRef.current.queryRenderedFeatures(
                    point,
                    { layers: interactiveLayerKeys },
                );
                if (interactiveFeatures.length <= 0) {
                    mapboxglMap.getCanvas().style.cursor = '';
                } else {
                    mapboxglMap.getCanvas().style.cursor = 'pointer';
                }

                const hoverableLayerKeys = layers
                    .filter(layer => !!layer.onMouseEnter || !!layer.onMouseLeave)
                    .map(layer => layer.layerKey);

                const hoverableFeatures = mapRef.current.queryRenderedFeatures(
                    point,
                    { layers: hoverableLayerKeys },
                );

                if (hoverableFeatures.length <= 0) {
                    if (lastIn.current) {
                        mapboxglMap.removeFeatureState(
                            {
                                id: lastIn.current.id,
                                source: lastIn.current.sourceName,
                                sourceLayer: lastIn.current.sourceLayer,
                            },
                            'hovered',
                        );
                        const layer = findLayerFromLayers(layers, lastIn.current.layerName);
                        if (layer && layer.onMouseLeave) {
                            layer.onMouseLeave();
                        }
                    }
                    lastIn.current = undefined;
                    return;
                }

                const firstFeature = hoverableFeatures[0];
                if (
                    !lastIn.current
                    || firstFeature.source !== lastIn.current.sourceName
                    || firstFeature.sourceLayer !== lastIn.current.sourceLayer
                    || firstFeature.layer.id !== lastIn.current.layerName
                    || firstFeature.id !== lastIn.current.id
                ) {
                    if (lastIn.current) {
                        mapboxglMap.removeFeatureState(
                            {
                                id: lastIn.current.id,
                                source: lastIn.current.sourceName,
                                sourceLayer: lastIn.current.sourceLayer,
                            },
                            'hovered',
                        );
                    }
                    if (lastIn.current && (
                        firstFeature.source !== lastIn.current.sourceName
                        || firstFeature.sourceLayer !== lastIn.current.sourceLayer
                        || firstFeature.layer.id !== lastIn.current.layerName
                    )) {
                        const layer = findLayerFromLayers(layers, lastIn.current.layerName);
                        if (layer && layer.onMouseLeave) {
                            layer.onMouseLeave();
                        }
                    }

                    lastIn.current = {
                        id: firstFeature.id,
                        layerName: firstFeature.layer.id,
                        sourceName: firstFeature.source,
                        sourceLayer: firstFeature.sourceLayer,
                    };

                    mapboxglMap.setFeatureState(
                        {
                            id: lastIn.current.id,
                            source: lastIn.current.sourceName,
                            sourceLayer: lastIn.current.sourceLayer,
                        },
                        { hovered: true },
                    );

                    const { layer: { id } } = firstFeature;
                    const layer = findLayerFromLayers(layers, id);
                    if (layer && layer.onMouseEnter) {
                        layer.onMouseEnter(firstFeature, lngLat, point);
                    }
                }
            };

            mapboxglMap.on('click', handleClick);
            mapboxglMap.on('dblclick', handleDoubleClick);
            mapboxglMap.on('mousemove', handleMouseMove);

            if (scaleControlShown) {
                const scale = new mapboxgl.ScaleControl(scaleControlOptions);
                mapboxglMap.addControl(scale, scaleControlPosition);
            }

            if (navControlShown) {
                // NOTE: don't we need to remove control on unmount?
                const nav = new mapboxgl.NavigationControl(navControlOptions);
                mapboxglMap.addControl(
                    nav,
                    navControlPosition,
                );
            }

            // TODO: need to resize map in some cases
            const timer = setTimeout(() => {
                mapboxglMap.resize();
            }, 200);

            const destroy = () => {
                clearTimeout(timer);

                mapboxglMap.off('click', handleClick);
                mapboxglMap.off('dblclick', handleDoubleClick);
                mapboxglMap.off('mousemove', handleMouseMove);

                sourcesRef.current = {};
                lastIn.current = undefined;
                /*
                Object.entries(sourcesRef.current).forEach(([_, source]) => {
                    source.destroy();
                });
                */

                console.warn('Removing map');
                mapboxglMap.remove();
            };

            return destroy;
        },
        [],
    );

    useEffect(
        () => {
            if (UNSUPPORTED_BROWSER) {
                return noop;
            }
            if (mapRef.current && mapStyleFromProps) {
                sourcesRef.current = {};
                lastIn.current = undefined;
                /*
                Object.entries(sourcesRef.current).forEach(([_, source]) => {
                    source.destroy();
                });
                */

                console.warn(`Setting map style ${mapStyleFromProps}`);
                mapRef.current.setStyle(mapStyleFromProps);

                const onStyleData = () => {
                    console.info('Passing mapStyle:', mapStyleFromProps);
                    setMapStyle(mapStyleFromProps);
                };
                mapRef.current.once('styledata', onStyleData);

                const onLoad = () => {
                    setLoaded(true);
                };
                mapRef.current.once('load', onLoad);

                return () => {
                    if (mapRef.current) {
                        mapRef.current.off('styledata', onStyleData);

                        mapRef.current.off('load', onLoad);
                    }
                };
            }
            return noop;
        },
        [mapStyleFromProps],
    );

    const children = props.children as React.ReactElement<any>;
    if (UNSUPPORTED_BROWSER) {
        return children;
    }

    const childrenProps = {
        map: mapRef.current,
        mapStyle: loaded ? mapStyle : undefined,
        mapContainerRef,
        getSource: (sourceKey: string) => sourcesRef.current[sourceKey],
        isSourceDefined: (sourceKey: string) => !!sourcesRef.current[sourceKey],
        setSource: (source: Source) => {
            sourcesRef.current = produce(sourcesRef.current, (safeSource) => {
                const { name } = source;
                // eslint-disable-next-line no-param-reassign
                safeSource[name] = source;
            });
        },
        removeSource: (sourceKey: string) => {
            if (!sourcesRef.current[sourceKey]) {
                // console.error(`No source named: ${sourceKey}`);
                return;
            }

            sourcesRef.current = produce(sourcesRef.current, (safeSource) => {
                // eslint-disable-next-line no-param-reassign
                delete safeSource[sourceKey];
            });

            if (mapRef.current) {
                console.warn(`Removing source: ${sourceKey}`);
                mapRef.current.removeSource(sourceKey);
            }
        },
    };

    return (
        <MapChildContext.Provider value={childrenProps}>
            {children}
        </MapChildContext.Provider>
    );
};

Map.defaultProps = {
    scaleControlShown: false,
    scaleControlPosition: 'bottom-right',

    navControlShown: false,
    navControlPosition: 'top-right',
};

export default Map;
