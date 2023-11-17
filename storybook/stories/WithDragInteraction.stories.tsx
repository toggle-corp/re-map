import React, { useCallback, useState } from 'react';
import Map, {
    MapContainer,
    MapLayer,
    MapSource,
    MapBounds,
    type Dragging,
    isGeoJSONSource,
} from '@togglecorp/re-map';
import {
    type GeoJSONSourceSpecification,
    type CircleLayerSpecification,
    type LngLatBoundsLike,
    Map as MaplibreMap,
    type LngLat,
} from 'maplibre-gl';
import { produce } from 'immer';

import pointGeoJSON from './points.geo.json';
import styles from './styles.module.css';

const bounds: LngLatBoundsLike = [80.0884245137, 26.3978980576, 88.1748043151, 30.4227169866];

const sourceOptions: Omit<GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

const circleLayerOptions: Omit<CircleLayerSpecification, 'id' | 'source'> = {
    type: 'circle',
    paint: {
        'circle-opacity': [
            'case',
            ['boolean', ['get', 'transient'], false],
            0.3,
            0.7,
        ],
        'circle-color': '#1a3ed0',
        'circle-radius': 8,
    },
};

export function Default() {
    const [points, setPoints] = useState(
        pointGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Point>,
    );

    const handleDrag = useCallback(
        (
            feature: Dragging,
            lngLat: LngLat,
            _: unknown,
            map: MaplibreMap,
        ) => {
            const transientPointIndex = points.features.findIndex(
                (item) => item.id && +item.id === 0,
            );

            let locations: typeof points | undefined;
            if (transientPointIndex <= -1) {
                // create a new transient point
                const originalPoint = points.features.find(
                    (item) => item.id && +item.id === feature.id,
                );
                if (!originalPoint) {
                    locations = undefined;
                } else {
                    const transientPoint = produce(
                        originalPoint,
                        (safeOriginalPoint) => {
                            if (!safeOriginalPoint) {
                                return;
                            }
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.id = 0;
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.geometry.coordinates = [
                                lngLat.lng,
                                lngLat.lat,
                            ];
                            if (!safeOriginalPoint.properties) {
                                // eslint-disable-next-line no-param-reassign
                                safeOriginalPoint.properties = {};
                            }
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.properties.transient = true;
                        },
                    );
                    locations = produce(points, (safeLocations) => {
                        // NOTE: unshift instead of push because find will
                        // always check from start. (optimization)
                        safeLocations.features.unshift(transientPoint);
                    });
                }
            } else {
                locations = produce(points, (safeLocations) => {
                    // eslint-disable-next-line no-param-reassign
                    safeLocations.features[transientPointIndex].geometry.coordinates = [
                        lngLat.lng,
                        lngLat.lat,
                    ];
                });
            }

            if (!locations) {
                return;
            }

            const source = map.getSource(feature.sourceName);
            if (source && isGeoJSONSource(source)) {
                source.setData(locations);
            }
        },
        [points],
    );

    const handleDragEnd = useCallback(
        (
            feature: Dragging,
            lngLat: LngLat,
        ) => {
            setPoints((oldPoints) => {
                const newPoints = produce(oldPoints, (safePoints) => {
                    const index = safePoints.features.findIndex(
                        (item) => item.id === feature.id,
                    );
                    if (index !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        safePoints.features[index].geometry.coordinates = [lngLat.lng, lngLat.lat];
                    }
                });
                return newPoints;
            });
        },
        [],
    );

    return (
        <Map
            mapStyle="https://demotiles.maplibre.org/style.json"
            mapOptions={{
                logoPosition: 'bottom-left',
                zoom: 1.5,
                minZoom: 1,
                maxZoom: 18,
            }}
            scaleControlShown
            navControlShown
        >
            <MapContainer className={styles.container} />
            <MapBounds
                bounds={bounds}
                padding={10}
                duration={0}
            />
            <MapSource
                sourceKey="points"
                sourceOptions={sourceOptions}
                geoJson={points}
            >
                <MapLayer
                    layerKey="circle"
                    layerOptions={circleLayerOptions}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                />
            </MapSource>
        </Map>
    );
}

export default {
    title: 'Basic/With Drag Interaction',
};
