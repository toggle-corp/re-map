import React from 'react';
import isChromatic from 'chromatic/isChromatic';
import Map, {
    MapContainer,
    MapCenter,
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
            <MapCenter
                center={[
                    84.1240, 28.3949,
                ]}
                centerOptions={{
                    zoom: 4,
                    duration: isChromatic() ? 0 : 1000,
                }}
            />
        </Map>
    );
}

export default {
    title: 'Basic/Fly to Location',
    parameters: { delay: 1000 },
};
