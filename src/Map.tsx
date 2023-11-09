import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    type MapOptions,
    ScaleControl,
    type LngLatBoundsLike,
    Map as MaplibreMap,
    type PaddingOptions,
    type MapMouseEvent,
    NavigationControl,
} from 'maplibre-gl';

import { getLayerName } from './utils';
import {
    Layer,
    Sources,
    Source,
    Dragging,
} from './type';
import { MapChildContext } from './context';

function isWebglSupported() {
    if (window.WebGLRenderingContext) {
        const canvas = document.createElement('canvas');
        try {
            // Note that { failIfMajorPerformanceCaveat: true } can be passed
            // as a second argument to canvas.getContext(), causing the check
            // to fail if hardware rendering is not available. See
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
            // for more details.
            const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (context && typeof context.getParameter === 'function') {
                return true;
            }
        } catch (e) {
            // WebGL is supported, but disabled
        }
        return false;
    }
    // WebGL not supported
    return false;
}

const UNSUPPORTED_BROWSER = !isWebglSupported();

interface LastInLayer {
    id: string | number | undefined;
    layerName: string;
    // NOTE: may not need to use these two below
    sourceName: string;
    // NOTE: sourceLayer may never be defined for our usecase
    sourceLayer: string | undefined;
}

interface ExtendedLayer extends Layer {
    layerKey: string;
    sourceKey: string;
}

function findLayerFromLayers(layers: ExtendedLayer[], layerKey: string) {
    const layer = layers.find((l) => l.layerKey === layerKey);
    return layer;
}

function getLayersForSources(sources: Sources) {
    const layers = Object.entries(sources)
        .filter(([, source]) => !!source.layers)
        .map(([sourceKey, source]) => (
            Object.entries(source.layers)
                .map(([layerKey, layer]) => ({
                    ...layer,
                    sourceKey,
                    layerKey: getLayerName(sourceKey, layerKey, source.managed),
                }))
        ));
    return layers.flat();
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

type Pos = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface Props {
    mapStyle: MapOptions['style'];
    mapOptions: Omit<MapOptions, 'style' | 'container'>;

    scaleControlShown: boolean;
    scaleControlPosition?: Pos;
    scaleControlOptions?: ConstructorParameters<typeof ScaleControl>[0];

    navControlShown: boolean;
    navControlPosition?: Pos;
    navControlOptions?: ConstructorParameters<typeof NavigationControl>[0];

    debug?: boolean;

    children?: React.ReactNode;
}

function Map(props: Props) {
    const {
        mapStyle: mapStyleFromProps,
        mapOptions,

        scaleControlPosition = 'bottom-right',
        scaleControlShown = false,
        scaleControlOptions = {},

        navControlShown = false,
        navControlOptions = {},
        navControlPosition = 'top-right',

        children,

        debug = false,
    } = props;

    const [initialDebug] = useState(debug);
    const [initialMapStyle] = useState(mapStyleFromProps);
    const [initialMapOptions] = useState(mapOptions);
    const [initialNavControlOptions] = useState(navControlOptions);
    const [initialNavControlPosition] = useState(navControlPosition);
    const [initialNavControlShown] = useState(navControlShown);
    const [initialScaleControlOptions] = useState(scaleControlOptions);
    const [initialScaleControlPosition] = useState(scaleControlPosition);
    const [initialScaleControlShown] = useState(scaleControlShown);

    const [mapStyle, setMapStyle] = useState<MapOptions['style'] | undefined>(undefined);
    const [loaded, setLoaded] = useState<boolean>(false);

    const boundsRef = useRef<LngLatBoundsLike | undefined>();
    const paddingRef = useRef<number | PaddingOptions | undefined>();
    const durationRef = useRef<number | undefined>();

    const dragging = useRef<Dragging | undefined>(undefined);
    const lastIn = useRef<LastInLayer | undefined>(undefined);
    const mapDestroyedRef = useRef(false);
    const sourcesRef = useRef<Sources>({});
    const mapRef = useRef<MaplibreMap | undefined>(undefined);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const setBounds = useCallback(
        (
            bounds: LngLatBoundsLike | undefined,
            padding: number | PaddingOptions | undefined,
            duration: number | undefined,
        ) => {
            boundsRef.current = bounds;
            paddingRef.current = padding;
            durationRef.current = duration;
        },
        [],
    );

    // Create map
    useEffect(
        () => {
            if (UNSUPPORTED_BROWSER) {
                // eslint-disable-next-line no-console
                console.error('No support.');
                return noop;
            }

            const { current: mapContainer } = mapContainerRef;
            if (!mapContainer) {
                // eslint-disable-next-line no-console
                console.error('No container found.');
                return noop;
            }

            const maplibreglMap = new MaplibreMap({
                container: mapContainer,
                style: initialMapStyle,
                preserveDrawingBuffer: true,
                ...initialMapOptions,
            });

            mapDestroyedRef.current = false;
            mapRef.current = maplibreglMap;
            // FIXME: we shouldn't always set cursor to pointer
            // mapboxglMap.getCanvas().style.cursor = 'pointer';

            if (initialScaleControlShown) {
                const scale = new ScaleControl(initialScaleControlOptions);
                maplibreglMap.addControl(scale, initialScaleControlPosition);
            }

            if (initialNavControlShown) {
                // NOTE: don't we need to remove control on unmount?
                const nav = new NavigationControl(initialNavControlOptions);
                maplibreglMap.addControl(
                    nav,
                    initialNavControlPosition,
                );
            }

            const handleMouseDown = (data: MapMouseEvent) => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }

                if (dragging.current) {
                    dragging.current = undefined;
                    maplibreglMap.getCanvas().style.cursor = '';
                }

                const { point } = data;

                const layers = getLayersForSources(sourcesRef.current);
                const draggableLayerKeys = layers
                    .filter((layer) => !!layer.onDrag)
                    .map((layer) => layer.layerKey);
                const draggableFeatures = map.queryRenderedFeatures(
                    point,
                    { layers: draggableLayerKeys },
                );

                if (draggableFeatures.length <= 0) {
                    if (initialDebug) {
                        // eslint-disable-next-line no-console
                        console.warn('No draggable layer found.');
                    }
                    return;
                }
                const firstFeature = draggableFeatures[0];
                dragging.current = {
                    id: firstFeature.id,
                    layerName: firstFeature.layer.id,
                    sourceName: firstFeature.source,
                    // sourceLayer: firstFeature.sourceLayer,
                };
                maplibreglMap.getCanvas().style.cursor = 'grabbing';
                data.preventDefault();
            };

            const handleMouseUp = (data: MapMouseEvent) => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }
                if (!dragging.current) {
                    return;
                }
                const {
                    point,
                    lngLat,
                } = data;

                const { layerName } = dragging.current;
                const layers = getLayersForSources(sourcesRef.current);
                const layer = findLayerFromLayers(layers, layerName);

                if (layer && layer.onDragEnd) {
                    layer.onDragEnd(dragging.current, lngLat, point, map);
                }
                // set dragging false
                dragging.current = undefined;
                maplibreglMap.getCanvas().style.cursor = '';
            };

            const handleClick = (data: MapMouseEvent) => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }
                if (dragging.current) {
                    dragging.current = undefined;
                    maplibreglMap.getCanvas().style.cursor = '';
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);

                const {
                    point,
                    lngLat,
                } = data;

                const clickableLayerKeys = layers
                    .filter((layer) => !!layer.onClick)
                    .map((layer) => layer.layerKey);

                const clickableFeatures = map.queryRenderedFeatures(
                    point,
                    { layers: clickableLayerKeys },
                );

                if (clickableFeatures.length <= 0) {
                    if (initialDebug) {
                        // eslint-disable-next-line no-console
                        console.warn('No clickable layer found.');
                    }
                    // TODO: add a global handler
                    return;
                }
                clickableFeatures.every((clickableFeature) => {
                    const { layer: { id } } = clickableFeature;

                    const layer = findLayerFromLayers(layers, id);
                    if (layer && layer.onClick) {
                        return !layer.onClick(clickableFeature, lngLat, point, map);
                    }
                    return false;
                });
            };

            const handleDoubleClick = (data: MapMouseEvent) => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }
                if (dragging.current) {
                    dragging.current = undefined;
                    maplibreglMap.getCanvas().style.cursor = '';
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);

                const {
                    point,
                    lngLat,
                } = data;

                const clickableLayerKeys = layers
                    .filter((layer) => !!layer.onDoubleClick)
                    .map((layer) => layer.layerKey);

                const clickableFeatures = map.queryRenderedFeatures(
                    point,
                    { layers: clickableLayerKeys },
                );

                if (clickableFeatures.length <= 0) {
                    if (initialDebug) {
                        // eslint-disable-next-line no-console
                        console.warn('No clickable layer found.');
                    }
                    // TODO: add a global handler
                    return;
                }
                clickableFeatures.every((clickableFeature) => {
                    const { layer: { id } } = clickableFeature;

                    const layer = findLayerFromLayers(layers, id);
                    if (layer && layer.onDoubleClick) {
                        return !layer.onDoubleClick(clickableFeature, lngLat, point, map);
                    }
                    return false;
                });
            };

            const handleMouseMove = (data: MapMouseEvent) => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }

                const {
                    point,
                    lngLat,
                } = data;

                if (dragging.current) {
                    const { layerName } = dragging.current;
                    const layers = getLayersForSources(sourcesRef.current);
                    const layer = findLayerFromLayers(layers, layerName);

                    if (layer && layer.onDrag) {
                        layer.onDrag(dragging.current, lngLat, point, map);
                    }
                    // TODO: do some other things
                    return;
                }

                const layers = getLayersForSources(sourcesRef.current);
                const interactiveLayerKeys = layers
                    .filter((layer) => (
                        !!layer.onClick || !!layer.onDoubleClick || !!layer.onDrag
                    ))
                    .map((layer) => layer.layerKey);
                const interactiveFeatures = map.queryRenderedFeatures(
                    point,
                    { layers: interactiveLayerKeys },
                );
                if (interactiveFeatures.length <= 0) {
                    maplibreglMap.getCanvas().style.cursor = '';
                } else {
                    maplibreglMap.getCanvas().style.cursor = 'pointer';
                }

                const hoverableLayerKeys = layers
                    .filter((layer) => (
                        !!layer.onMouseEnter || !!layer.onMouseLeave || !!layer.hoverable
                    ))
                    .map((layer) => layer.layerKey);

                const hoverableFeatures = map.queryRenderedFeatures(
                    point,
                    { layers: hoverableLayerKeys },
                );

                if (hoverableFeatures.length <= 0) {
                    if (lastIn.current) {
                        maplibreglMap.removeFeatureState(
                            {
                                id: lastIn.current.id,
                                source: lastIn.current.sourceName,
                                sourceLayer: lastIn.current.sourceLayer,
                            },
                            'hovered',
                        );
                        const layer = findLayerFromLayers(layers, lastIn.current.layerName);
                        if (layer && layer.onMouseLeave) {
                            layer.onMouseLeave(map);
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
                        maplibreglMap.removeFeatureState(
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
                            layer.onMouseLeave(map);
                        }
                    }

                    lastIn.current = {
                        id: firstFeature.id,
                        layerName: firstFeature.layer.id,
                        sourceName: firstFeature.source,
                        sourceLayer: firstFeature.sourceLayer,
                    };

                    maplibreglMap.setFeatureState(
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
                        layer.onMouseEnter(firstFeature, lngLat, point, map);
                    }
                }
            };

            const handleResize = () => {
                const { current: map } = mapRef;
                if (!map) {
                    return;
                }

                if (!boundsRef.current) {
                    return;
                }
                map.fitBounds(
                    boundsRef.current,
                    {
                        padding: paddingRef.current,
                        duration: durationRef.current,
                    },
                );
            };

            maplibreglMap.on('click', handleClick);
            maplibreglMap.on('dblclick', handleDoubleClick);
            maplibreglMap.on('mousemove', handleMouseMove);
            maplibreglMap.on('resize', handleResize);
            maplibreglMap.on('mousedown', handleMouseDown);
            maplibreglMap.on('mouseup', handleMouseUp);

            const destroy = () => {
                // clearTimeout(timer);

                maplibreglMap.off('click', handleClick);
                maplibreglMap.off('dblclick', handleDoubleClick);
                maplibreglMap.off('mousemove', handleMouseMove);
                maplibreglMap.off('resize', handleResize);

                // FIXME: looks like mousedown and mouseup aren't handled

                sourcesRef.current = {};
                lastIn.current = undefined;
                mapDestroyedRef.current = true;

                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.warn('Removing map');
                }
                maplibreglMap.remove();
            };

            return destroy;
        },
        [
            initialDebug,
            initialMapStyle,
            initialMapOptions,
            initialNavControlOptions,
            initialNavControlPosition,
            initialNavControlShown,
            initialScaleControlOptions,
            initialScaleControlPosition,
            initialScaleControlShown,
        ],
    );

    // Handle style load and map ready
    useEffect(
        () => {
            const { current: map } = mapRef;
            if (UNSUPPORTED_BROWSER || !map || !mapStyleFromProps) {
                return noop;
            }
            sourcesRef.current = {};
            lastIn.current = undefined;

            if (initialDebug) {
                // eslint-disable-next-line no-console
                console.warn(`Setting map style ${mapStyleFromProps}`);
            }

            map.setStyle(mapStyleFromProps);
            const onStyleData = () => {
                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.info('Passing mapStyle:', mapStyleFromProps);
                }
                setMapStyle(mapStyleFromProps);
            };
            map.once('styledata', onStyleData);

            // FIXME: This will only be called once, should be moved when
            // map object is created
            const onLoad = () => {
                setLoaded(true);
            };
            map.once('load', onLoad);

            return () => {
                if (mapRef.current) {
                    mapRef.current.off('styledata', onStyleData);

                    mapRef.current.off('load', onLoad);
                }
            };
        },
        [mapStyleFromProps, initialDebug],
    );

    const isMapDestroyed = useCallback(
        () => !!mapDestroyedRef.current,
        [],
    );

    const isSourceDefined = useCallback(
        (sourceKey: string) => (
            !!sourcesRef.current[sourceKey]
        ),
        [],
    );

    const getSource = useCallback(
        (sourceKey: string) => (
            sourcesRef.current[sourceKey]
        ),
        [],
    );

    const setSource = useCallback(
        (source: Source) => {
            const { name } = source;
            sourcesRef.current = {
                ...sourcesRef.current,
                [name]: source,
            };
        },
        [],
    );

    const removeSource = useCallback(
        (sourceKey: string) => {
            if (!sourcesRef.current[sourceKey]) {
                return;
            }

            sourcesRef.current = {
                ...sourcesRef.current,
            };

            delete sourcesRef.current[sourceKey];

            const { current: map } = mapRef;
            if (map) {
                if (initialDebug) {
                    // eslint-disable-next-line no-console
                    console.warn(`Removing source: ${sourceKey}`);
                }
                map.removeSource(sourceKey);
            }
        },
        [initialDebug],
    );

    const childrenProps = useMemo(
        () => ({
            map: mapRef.current,
            mapStyle: loaded ? mapStyle : undefined,
            mapContainerRef,

            isSourceDefined,
            getSource,
            setSource,
            removeSource,

            isMapDestroyed,

            setBounds,
            debug: initialDebug,
        }),
        [
            mapStyle,
            loaded,
            isSourceDefined,
            getSource,
            setSource,
            removeSource,
            isMapDestroyed,
            setBounds,
            initialDebug,
        ],
    );

    const mapChildren = children as React.ReactElement<unknown>;
    if (UNSUPPORTED_BROWSER) {
        return mapChildren;
    }

    return (
        <MapChildContext.Provider value={childrenProps}>
            {mapChildren}
        </MapChildContext.Provider>
    );
}

export default Map;
