import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export function getLayerName(sourceKey: string, layerKey: string) {
    return `${sourceKey}›${layerKey}`;
}

export function usePrevious<T>(value: T, initialValue: T) {
    const ref = useRef<T>(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export function setMapboxToken(token: string) {
    mapboxgl.accessToken = token;
}
