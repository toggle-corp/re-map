import React from 'react';
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
                    duration: 1000,
                }}
            />
        </Map>
    );
}

export default {
    title: 'Basic/Fly to Location',
};
