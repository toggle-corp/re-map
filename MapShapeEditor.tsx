import mapboxgl from 'mapbox-gl';
import { useContext, useEffect, useState, useRef } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
import { Draw } from './type';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type Mode = 'simple_select' | 'direct_select' | 'draw_point' | 'draw_line_string' | 'draw_polygon';

interface EditEvent {
    features: mapboxgl.MapboxGeoJSONFeature[];
}

interface ModeChangeEvent {
    mode: Mode;
}


interface Props {
    geoJsons: mapboxgl.MapboxGeoJSONFeature[];

    onCreate?: (geojsons: mapboxgl.MapboxGeoJSONFeature[], draw: Draw | undefined) => void;
    onDelete?: (geojsons: mapboxgl.MapboxGeoJSONFeature[], draw: Draw | undefined) => void;
    onUpdate?: (geojsons: mapboxgl.MapboxGeoJSONFeature[], draw: Draw | undefined) => void;
    onModeChange?: (mode: Mode) => void;
}

const defaultDrawOptions = ({
    displayControlsDefault: false,
    controls: {
        point: true,
        polygon: true,
        trash: true,
    },
});

const MapShapeEditor = (props: Props) => {
    const {
        onCreate,
        onDelete,
        onUpdate,
        onModeChange,
        geoJsons,
        drawOptions = defaultDrawOptions,
        drawPosition = 'bottom-right',
    } = props;
    const {
        map,
        mapStyle,
        isMapDestroyed,
    } = useContext(MapChildContext);

    const [initialGeoJsons] = useState(geoJsons);
    const drawRef = useRef<Draw | undefined>();

    // Create and destroy control
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const draw = new MapboxDraw(drawOptions);

            map.addControl(
                draw,
                drawPosition,
            );

            // Load geojsons
            initialGeoJsons.forEach((geoJson) => {
                draw.add(geoJson);
            });

            drawRef.current = draw as Draw;

            return () => {
                if (!isMapDestroyed()) {
                    map.removeControl(draw);
                }
            };
        },
        [map, mapStyle, isMapDestroyed, initialGeoJsons],
    );

    // Handle change in draw.create
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const handleCreate = (e: EditEvent) => {
                if (onCreate) {
                    onCreate(e.features, drawRef.current);
                }
            };

            map.on('draw.create', handleCreate);
            return () => {
                if (!isMapDestroyed()) {
                    map.off('draw.create', handleCreate);
                }
            };
        },
        [map, mapStyle, onCreate, isMapDestroyed],
    );

    // Handle change in draw.update
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const handleUpdate = (e: EditEvent) => {
                if (onUpdate) {
                    onUpdate(e.features, drawRef.current);
                }
            };

            map.on('draw.update', handleUpdate);
            return () => {
                if (!isMapDestroyed()) {
                    map.off('draw.update', handleUpdate);
                }
            };
        },
        [map, mapStyle, onUpdate, isMapDestroyed],
    );

    // Handle change in draw.delete
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const handleDelete = (e: EditEvent) => {
                if (onDelete) {
                    onDelete(e.features, drawRef.current);
                }
            };

            map.on('draw.delete', handleDelete);
            return () => {
                if (!isMapDestroyed()) {
                    map.off('draw.delete', handleDelete);
                }
            };
        },
        [map, mapStyle, onDelete, isMapDestroyed],
    );

    // Handle change in draw.modechange
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const handleModeChange = (e: ModeChangeEvent) => {
                if (onModeChange) {
                    onModeChange(e.mode, drawRef.current);
                }
            };

            map.on('draw.modechange', handleModeChange);

            return () => {
                if (!isMapDestroyed) {
                    map.off('draw.modechange', handleModeChange);
                }
            };
        },
        [map, mapStyle, onModeChange, isMapDestroyed],
    );

    return null;
};


MapShapeEditor.defaultProps = {
    geoJsons: [],
};

export default MapShapeEditor;
