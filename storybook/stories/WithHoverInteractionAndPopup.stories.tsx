import React, { useState, useCallback } from 'react';
import Map, {
    MapContainer,
    MapLayer,
    MapSource,
    MapBounds,
    MapPopup,
} from '@togglecorp/re-map';
import {
    type GeoJSONSourceSpecification,
    type FillLayerSpecification,
    type LineLayerSpecification,
    type LngLatLike,
    type PopupOptions,
    type GeoJSONFeature,
    type LngLat,
    type LngLatBoundsLike,
} from 'maplibre-gl';

import nepalGeoJSON from './nepal.geo.json';
import styles from './styles.module.css';

const tooltipOptions: PopupOptions = {
    closeOnClick: false,
    closeButton: false,
    offset: 12,
};

const sourceOptions: Omit<GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

const fillLayerOptions: Omit<FillLayerSpecification, 'id' | 'source'> = {
    type: 'fill',
    paint: {
        'fill-opacity': ['case',
            ['boolean', ['feature-state', 'hovered'], false],
            0.7,
            0.5,
        ],
        'fill-color': '#a9bedc',
    },
};

const lineLayerOptions: Omit<LineLayerSpecification, 'id' | 'source'> = {
    type: 'line',
    paint: {
        'line-color': '#1a3ed0',
        'line-width': ['case',
            ['boolean', ['feature-state', 'hovered'], false],
            4,
            2,
        ],
    },
};

const bounds: LngLatBoundsLike = [80.0884245137, 26.3978980576, 88.1748043151, 30.4227169866];

export function Default() {
    const [
        hoverFeatureProperties,
        setHoverFeatureProperties,
    ] = useState<{ name: string } | undefined>(undefined);
    const [
        hoverLngLat,
        setHoverLngLat,
    ] = useState<LngLatLike>();

    const handleMouseEnter = useCallback((feature: GeoJSONFeature, lngLat: LngLat) => {
        setHoverLngLat(lngLat);
        setHoverFeatureProperties({
            name: feature.properties.DIST_EN,
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHoverLngLat(undefined);
        setHoverFeatureProperties(undefined);
    }, []);

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
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    hoverable
                />
                <MapLayer
                    layerKey="line"
                    layerOptions={lineLayerOptions}
                />
            </MapSource>
            {hoverLngLat && hoverFeatureProperties && (
                <MapPopup
                    coordinates={hoverLngLat}
                    popupOptions={tooltipOptions}
                    trackPointer
                    hidden={false}
                >
                    <div>
                        {hoverFeatureProperties.name}
                    </div>
                </MapPopup>
            )}
        </Map>
    );
}

export default {
    title: 'Basic/With Hover Interaction and Popup',
    parameters: { delay: 1000 },
};
