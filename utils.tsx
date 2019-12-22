import { useEffect, useRef } from 'react';

// eslint-disable-next-line import/prefer-default-export
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
