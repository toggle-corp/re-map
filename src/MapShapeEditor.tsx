import {
    type GeoJSONFeature,
    type IControl,
} from 'maplibre-gl';
import {
    useContext, useEffect, useState, useRef,
} from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { _cs } from '@togglecorp/fujs';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type Mode = 'simple_select' | 'direct_select' | 'draw_point' | 'draw_line_string' | 'draw_polygon';

interface EditEvent {
    features: GeoJSONFeature[];
}

interface ModeChangeEvent {
    mode: Mode;
}

interface Props {
    geoJsons: GeoJSONFeature[];

    onCreate?: (geojsons: GeoJSONFeature[], draw: MapboxDraw) => void;
    onDelete?: (geojsons: GeoJSONFeature[], draw: MapboxDraw) => void;
    onUpdate?: (geojsons: GeoJSONFeature[], draw: MapboxDraw) => void;
    onModeChange?: (mode: Mode, draw: MapboxDraw) => void;

    drawOptions: Record<string, unknown>; // FIXME
    drawPosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'; // FIXME
    disabled?: boolean;
}

const defaultDrawOptions = ({
    displayControlsDefault: false,
    controls: {
        point: true,
        polygon: true,
        trash: true,
    },
});

const disabledClassName = 'disabled-map-draw-control';

const emptyGeoJsons: GeoJSONFeature[] = [];

function MapShapeEditor(props: Props) {
    const {
        onCreate,
        onDelete,
        onUpdate,
        onModeChange,
        geoJsons = emptyGeoJsons,
        drawOptions = defaultDrawOptions,
        drawPosition = 'bottom-right',
        disabled = false,
    } = props;
    const {
        map,
        mapStyle,
        isMapDestroyed,
        mapContainerRef,
    } = useContext(MapChildContext);

    const [initialDrawOptions] = useState(drawOptions);
    const [initialDrawPosition] = useState(drawPosition);
    const drawRef = useRef<MapboxDraw | undefined>();

    // Create and destroy control
    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            const draw = new MapboxDraw(initialDrawOptions);

            const drawControl: IControl = draw;

            map.addControl(
                drawControl,
                initialDrawPosition,
            );

            drawRef.current = draw;

            return () => {
                if (!isMapDestroyed()) {
                    map.removeControl(drawControl);
                }
            };
        },
        [map, mapStyle, isMapDestroyed, initialDrawOptions, initialDrawPosition],
    );

    // Handle change in draw.create
    useEffect(
        () => {
            if (!map || !mapStyle || disabled) {
                return noop;
            }

            const handleCreate = (e: EditEvent) => {
                if (onCreate && drawRef.current) {
                    onCreate(e.features, drawRef.current);
                }
                // TODO: add promoteId, set id in properties
            };

            map.on('draw.create', handleCreate);
            return () => {
                if (!isMapDestroyed()) {
                    map.off('draw.create', handleCreate);
                }
            };
        },
        [map, mapStyle, onCreate, isMapDestroyed, disabled],
    );

    // Handle change in draw.update
    useEffect(
        () => {
            if (!map || !mapStyle || disabled) {
                return noop;
            }

            const handleUpdate = (e: EditEvent) => {
                if (onUpdate && drawRef.current) {
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
        [map, mapStyle, onUpdate, isMapDestroyed, disabled],
    );

    // Handle change in draw.delete
    useEffect(
        () => {
            if (!map || !mapStyle || disabled) {
                return noop;
            }

            const handleDelete = (e: EditEvent) => {
                if (onDelete && drawRef.current) {
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
        [map, mapStyle, onDelete, isMapDestroyed, disabled],
    );

    // Handle change in draw.modechange
    useEffect(
        () => {
            if (!map || !mapStyle || disabled) {
                return noop;
            }

            const handleModeChange = (e: ModeChangeEvent) => {
                if (onModeChange && drawRef.current) {
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
        [map, mapStyle, onModeChange, isMapDestroyed, disabled],
    );

    // Handle geojson update
    useEffect(
        () => {
            if (!map || !mapStyle || !drawRef.current) {
                return;
            }
            if (disabled) {
                drawRef.current.set({
                    type: 'FeatureCollection',
                    features: [],
                });
            } else {
                drawRef.current.set({
                    type: 'FeatureCollection',
                    features: geoJsons,
                });
            }
        },
        [map, mapStyle, geoJsons, disabled],
    );

    // Handle disabling controls
    useEffect(
        () => {
            if (!mapContainerRef || !mapContainerRef.current) {
                return;
            }
            if (disabled) {
                mapContainerRef.current.className = _cs(
                    mapContainerRef.current.className,
                    disabledClassName,
                );
            } else {
                const classNames = mapContainerRef.current.className.split(' ');
                const filteredClassNames = classNames.filter((name) => name !== disabledClassName);
                mapContainerRef.current.className = _cs(...filteredClassNames);
            }
        },
        [mapContainerRef, disabled],
    );

    return null;
}

export default MapShapeEditor;
