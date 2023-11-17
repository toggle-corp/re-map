import React from 'react';
import Map, {
    MapContainer,
    MapLayer,
    MapSource,
    MapBounds,
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
        'fill-color': '#a9bedc',
    },
};

const lineLayerOptions: Omit<LineLayerSpecification, 'id' | 'source'> = {
    type: 'line',
    paint: {
        'line-color': '#1a3ed0',
        'line-width': 2,
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
            </MapSource>
        </Map>
    );
}

export default {
    title: 'Source/GeoJSON Source',
    parameters: { delay: 1000 },
};
