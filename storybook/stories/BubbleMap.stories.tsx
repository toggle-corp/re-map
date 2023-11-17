import React from 'react';
import Map, {
    MapContainer,
    MapLayer,
    MapSource,
    MapBounds,
} from '@togglecorp/re-map';
import {
    type GeoJSONSourceSpecification,
    type CircleLayerSpecification,
    type LngLatBoundsLike,
} from 'maplibre-gl';

import pointGeoJSON from './points.geo.json';
import styles from './styles.module.css';

const bounds: LngLatBoundsLike = [80.0884245137, 26.3978980576, 88.1748043151, 30.4227169866];

const sourceOptions: Omit<GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

const circleLayerOptions: Omit<CircleLayerSpecification, 'id' | 'source'> = {
    type: 'circle',
    paint: {
        'circle-opacity': 0.7,
        'circle-color': '#1a3ed0',
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'size'],
            0,
            0,
            100,
            30,
        ],
    },
};

export function Default() {
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
                geoJson={pointGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Geometry>}
            >
                <MapLayer
                    layerKey="circle"
                    layerOptions={circleLayerOptions}
                />
            </MapSource>
        </Map>
    );
}

export default {
    title: 'Type/Bubble Map',
    parameters: { delay: 500 },
};
