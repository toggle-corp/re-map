import React from 'react';
import {
    type Map,
    type MapOptions,
    type LngLatBoundsLike,
    type PaddingOptions,
} from 'maplibre-gl';

import { Source, Layer } from './type';

interface MapChildState {
    map?: Map;
    mapStyle?: MapOptions['style'];
    mapContainerRef?: React.RefObject<HTMLDivElement>;
    setSource: (source: Source) => void;
    getSource: (sourceKey: string) => Source | undefined;
    removeSource: (sourceKey: string) => void;
    isSourceDefined: (sourceKey: string) => boolean;
    isMapDestroyed: () => boolean;

    setBounds: (
        bounds: LngLatBoundsLike | undefined,
        padding: number | PaddingOptions | undefined,
        duration: number | undefined,
    ) => void;

    debug?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const initialMapChildState: MapChildState = {
    map: undefined,
    mapContainerRef: undefined,
    mapStyle: 'https://demotiles.maplibre.org/style.json',

    setSource: noop,
    getSource: () => undefined,
    removeSource: noop,
    isSourceDefined: () => false,
    isMapDestroyed: () => false,

    setBounds: noop,
    debug: false,
};

export const MapChildContext = React.createContext(initialMapChildState);

interface SourceChildState {
    map?: Map;
    mapStyle?: MapOptions['style'];
    sourceKey?: string;
    isSourceDefined: (sourceKey: string) => boolean;
    isMapDestroyed: () => boolean;
    managed: boolean;

    setLayer: (layerKey: string, method: (layer: Layer | undefined) => Layer | undefined) => void;
    getLayer: (layerKey: string) => Layer | undefined;
    removeLayer: (layerKey: string) => void;
    debug?: boolean;
}

const initialSourceChildState: SourceChildState = {
    map: undefined,
    mapStyle: 'https://demotiles.maplibre.org/style.json',
    sourceKey: undefined,
    isSourceDefined: () => false,
    isMapDestroyed: () => false,
    managed: true,

    setLayer: noop,
    getLayer: () => undefined,
    removeLayer: noop,
    debug: false,
};

export const SourceChildContext = React.createContext(initialSourceChildState);
