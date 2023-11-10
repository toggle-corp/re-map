import React from 'react';
import Map, {
    MapContainer,
    MapLayer,
    MapSource,
    MapBounds,
    MapState,
} from '@togglecorp/re-map';
import {
    type GeoJSONSourceSpecification,
    type FillLayerSpecification,
    type LineLayerSpecification,
    type LngLatBoundsLike,
} from 'maplibre-gl';

import nepalGeoJSON from './nepal.geo.json';
import styles from './styles.module.css';

const bounds: LngLatBoundsLike = [80.0884245137, 26.3978980576, 88.1748043151, 30.4227169866];

const sourceOptions: Omit<GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

const fillLayerOptions: Omit<FillLayerSpecification, 'id' | 'source'> = {
    type: 'fill',
    paint: {
        'fill-opacity': 0.7,
        'fill-color': [
            'interpolate',
            ['linear'],
            ['feature-state', 'weight'],
            0,
            '#a50026',
            10,
            '#d73027',
            20,
            '#f46d43',
            30,
            '#fdae61',
            40,
            '#fee090',
            50,
            '#e0f3f8',
            60,
            '#abd9e9',
            70,
            '#74add1',
            80,
            '#4575b4',
            90,
            '#313695',
            100,
            '#ffffff',
        ],
    },
};

const lineLayerOptions: Omit<LineLayerSpecification, 'id' | 'source'> = {
    type: 'line',
    paint: {
        'line-color': '#000000',
        'line-width': 1,
    },
};

const attributes = [
    { id: 1, value: 8 },
    { id: 2, value: 55 },
    { id: 3, value: 77 },
    { id: 4, value: 74 },
    { id: 5, value: 89 },
    { id: 6, value: 6 },
    { id: 7, value: 80 },
    { id: 8, value: 34 },
    { id: 9, value: 75 },
    { id: 10, value: 81 },
    { id: 11, value: 66 },
    { id: 12, value: 36 },
    { id: 13, value: 43 },
    { id: 14, value: 76 },
    { id: 15, value: 94 },
    { id: 16, value: 38 },
    { id: 17, value: 39 },
    { id: 18, value: 35 },
    { id: 19, value: 22 },
    { id: 20, value: 37 },
    { id: 21, value: 96 },
    { id: 22, value: 29 },
    { id: 23, value: 65 },
    { id: 24, value: 71 },
    { id: 25, value: 7 },
    { id: 26, value: 59 },
    { id: 27, value: 97 },
    { id: 28, value: 28 },
    { id: 29, value: 3 },
    { id: 30, value: 16 },
    { id: 31, value: 64 },
    { id: 32, value: 87 },
    { id: 33, value: 13 },
    { id: 34, value: 32 },
    { id: 35, value: 60 },
    { id: 36, value: 12 },
    { id: 37, value: 93 },
    { id: 38, value: 47 },
    { id: 39, value: 4 },
    { id: 40, value: 9 },
    { id: 41, value: 82 },
    { id: 42, value: 44 },
    { id: 43, value: 48 },
    { id: 44, value: 57 },
    { id: 45, value: 20 },
    { id: 46, value: 99 },
    { id: 47, value: 21 },
    { id: 48, value: 90 },
    { id: 49, value: 78 },
    { id: 50, value: 17 },
    { id: 51, value: 49 },
    { id: 52, value: 68 },
    { id: 53, value: 24 },
    { id: 54, value: 23 },
    { id: 55, value: 86 },
    { id: 56, value: 11 },
    { id: 57, value: 50 },
    { id: 58, value: 91 },
    { id: 59, value: 15 },
    { id: 60, value: 14 },
    { id: 61, value: 56 },
    { id: 62, value: 51 },
    { id: 63, value: 31 },
    { id: 64, value: 30 },
    { id: 65, value: 67 },
    { id: 66, value: 100 },
    { id: 67, value: 88 },
    { id: 68, value: 63 },
    { id: 69, value: 73 },
    { id: 70, value: 92 },
    { id: 71, value: 69 },
    { id: 72, value: 62 },
    { id: 73, value: 5 },
    { id: 74, value: 41 },
    { id: 75, value: 45 },
    { id: 76, value: 98 },
    { id: 77, value: 84 },
];

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
                sourceKey="region"
                sourceOptions={sourceOptions}
                geoJson={nepalGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Geometry>}
            >
                <MapLayer
                    layerKey="fill"
                    layerOptions={fillLayerOptions}
                />
                <MapLayer
                    layerKey="line"
                    layerOptions={lineLayerOptions}
                />
                <MapState
                    attributes={attributes}
                    attributeKey="weight"
                />
            </MapSource>
        </Map>
    );
}

export default {
    title: 'Type/Choropleth Map',
};
