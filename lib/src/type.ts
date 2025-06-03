import {
    type GeoJSONFeature,
    type LngLat,
    type Point2D,
    Map as MaplibreMap,
} from 'maplibre-gl';

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
        feature: GeoJSONFeature,
        lngLat: LngLat,
        point: Point2D,
        map: MaplibreMap,
    ) => boolean | undefined;
    onDoubleClick?: (
        feature: GeoJSONFeature,
        lngLat: LngLat,
        point: Point2D,
        map: MaplibreMap,
    ) => boolean | undefined;

    // Only called for topmost layer
    onMouseEnter?: (
        feature: GeoJSONFeature,
        lngLat: LngLat,
        point: Point2D,
        map: MaplibreMap,
    ) => void;
    onMouseLeave?: (map: MaplibreMap) => void;

    onDrag?: (
        feature: Dragging,
        lngLat: LngLat,
        point: Point2D,
        map: MaplibreMap,
    ) => void;
    onDragEnd?: (
        feature: Dragging,
        lngLat: LngLat,
        point: Point2D,
        map: MaplibreMap,
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
