export interface Dragging {
    id: string | number | undefined;
    layerName: string;
    sourceName: string;
}

export interface Layer {
    name: string;
    hoverable?: boolean;
    destroy: () => void;
    onClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => boolean | undefined;
    onDoubleClick?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => boolean | undefined;

    // Only called for topmost layer
    onMouseEnter?: (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
    onMouseLeave?: (map: mapboxgl.Map) => void;

    onDrag?: (
        feature: Dragging,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
    onDragEnd?: (
        feature: Dragging,
        lngLat: mapboxgl.LngLat,
        point: mapboxgl.Point,
        map: mapboxgl.Map,
    ) => void;
}

export interface Source {
    name: string;
    managed: boolean;
    destroy: () => void;
    layers: Obj<Layer>;
}

interface Obj<T> {
    [key: string]: T;
}

export type Sources = Obj<Source>;

export interface Draw {
    getMode: () => string;
    delete: (idList: string | string[]) => void;
    set: (featureCollection: Record<string, unknown>) => void;
}
