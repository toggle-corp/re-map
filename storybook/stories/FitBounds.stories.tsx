import React from 'react';
import Map, {
    MapContainer,
    MapBounds,
} from '@togglecorp/re-map';
import {
    type LngLatBoundsLike,
} from 'maplibre-gl';
import styles from './styles.module.css';

const bounds: LngLatBoundsLike = [80.0884245137, 26.3978980576, 88.1748043151, 30.4227169866];

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
                duration={1000}
            />
        </Map>
    );
}

export default {
    title: 'Basic/Fit Bounds',
    parameters: { delay: 500 },
};
