import React from 'react';
import Map, {
    MapContainer,
} from '@togglecorp/re-map';
import styles from './styles.module.css';

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
        </Map>
    );
}

export default {
    title: 'Basic/Simple Map',
    parameters: { delay: 500 },
};
