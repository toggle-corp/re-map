import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import produce from 'immer';

import { Sources, Source } from './type';
import { MapChildContext } from './context';

const UNSUPPORTED_BROWSER = !mapboxgl.supported();
const { REACT_APP_MAPBOX_ACCESS_TOKEN: TOKEN } = process.env;
if (TOKEN) {
    mapboxgl.accessToken = TOKEN;
}

interface Props {
    children?: React.ReactNode | null; // FIXME typings

    mapStyle: mapboxgl.MapboxOptions['style'];
    mapOptions: Omit<mapboxgl.MapboxOptions, 'style' | 'container'>;

    scaleControlShown: boolean;
    scaleControlPosition: Position;
    scaleControlOptions?: ConstructorParameters<typeof mapboxgl.ScaleControl>[0];

    navControlShown: boolean;
    navControlPosition: Position;
    navControlOptions?: ConstructorParameters<typeof mapboxgl.NavigationControl>[0];
}

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';


const Map = (props: Props) => {
    const {
        mapStyle: mapStyleFromProps,
        mapOptions,
        children,

        scaleControlPosition,
        scaleControlShown,
        scaleControlOptions,

        navControlShown,
        navControlOptions,
        navControlPosition,
    } = props;
    const [mapStyle, setMapStyle] = useState(mapStyleFromProps);

    const sourcesRef = useRef<Sources>({});

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | undefined>(undefined);

    useEffect(
        () => {
            if (UNSUPPORTED_BROWSER) {
                console.error('No Mapboxgl support.');
                return () => {};
            }
            const { current: mapContainer } = mapContainerRef;
            if (!mapContainer) {
                console.error('No container found.');
                return () => {};
            }

            const mapboxglMap = new mapboxgl.Map({
                container: mapContainer,
                style: mapStyleFromProps,
                preserveDrawingBuffer: true,
                ...mapOptions,
            });

            mapRef.current = mapboxglMap;
            console.warn('Creating new map');

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

            const onStyleData = (event: mapboxgl.MapEventType['styledata'] & mapboxgl.EventData) => {
                // FIXME: style.load will be deprecated
                const style = event.style.stylesheet.sprite;
                console.info(`Passing mapStyle: ${style}`);
                setMapStyle(style);
            };

            mapboxglMap.on('style.load', onStyleData);

            // NOTE: need to resize map in some cases
            const timer = setTimeout(() => {
                mapboxglMap.resize();
            }, 200);

            const destroy = () => {
                clearTimeout(timer);

                Object.entries(sourcesRef.current).forEach(([_, source]) => {
                    source.destroy();
                });

                mapboxglMap.off('style.load', onStyleData);

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
                return;
            }
            if (mapStyle === mapStyleFromProps) {
                console.info(`Skipping map style set: ${mapStyleFromProps}`);
                return;
            }
            if (mapRef.current && mapStyleFromProps) {
                console.warn(`Setting map style ${mapStyleFromProps}`);
                mapRef.current.setStyle(mapStyleFromProps);
            }
        },
        [mapStyleFromProps],
    );

    if (UNSUPPORTED_BROWSER) {
        return children;
    }

    const childrenProps = {
        map: mapRef.current,
        mapStyle,
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
    mapOptions: {},

    scaleControlShown: false,
    scaleControlPosition: 'bottom-right',

    navControlShown: false,
    navControlPosition: 'top-right',
};

export default Map;
