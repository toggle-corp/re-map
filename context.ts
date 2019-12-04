import React from 'react';
import mapboxgl from 'mapbox-gl';

import { Source, Layer } from './type';

interface MapChildState {
    map?: mapboxgl.Map;
    mapStyle?: mapboxgl.MapboxOptions['style'];
    mapContainerRef?: React.RefObject<HTMLDivElement>;
    setSource: (source: Source) => void;
    getSource: (sourceKey: string) => Source | undefined;
    removeSource: (sourceKey: string) => void;
    isSourceDefined: (sourceKey: string) => boolean;
}

const initialMapChildState: MapChildState = {
    map: undefined,
    mapContainerRef: undefined,
    mapStyle: 'mapbox://styles/mapbox/streets-v11',

    setSource: () => {},
    getSource: () => undefined,
    removeSource: () => {},
    isSourceDefined: () => false,
};

export const MapChildContext = React.createContext(initialMapChildState);


interface SourceChildState {
    map?: mapboxgl.Map;
    mapStyle?: string;
    sourceKey?: string;

    setLayer: (layer: Layer) => void;
    getLayer: (layerKey: string) => Layer | undefined;
    removeLayer: (layerKey: string) => void;
}

const initialSourceChildState: SourceChildState = {
    map: undefined,
    mapStyle: 'mapbox://styles/mapbox/streets-v11',
    sourceKey: undefined,

    setLayer: () => {},
    getLayer: () => undefined,
    removeLayer: () => {},
};

export const SourceChildContext = React.createContext(initialSourceChildState);
