import { useContext, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

import { SourceChildContext } from '../context';
// import { Layer } from '../type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props {
    layerKey: string;
    layerOptions: mapboxgl.Layer;
}

const MapLayer = (props: Props) => {
    const {
        layerKey,
        layerOptions,
    } = props;

    const {
        map,
        mapStyle,

        sourceKey,

        setLayer,
        removeLayer,
        getLayer,
    } = useContext(SourceChildContext);

    useEffect(
        () => {
            if (!map || !sourceKey || !layerKey) {
                return noop;
            }
            const id = `${sourceKey}›${layerKey}`;
            console.warn(`Creating new layer: ${id}`);
            map.addLayer({
                ...layerOptions,
                id,
                source: sourceKey,
            });

            const destroy = () => {
                const layer = getLayer(layerKey);
                if (!layer) {
                    // console.error(`No layer named: ${id}`);
                    return;
                }
                removeLayer(id);
            };

            setLayer({ name: layerKey, destroy });

            return destroy;
        },
        [map, mapStyle, sourceKey, layerKey],
    );

    return null;
};


MapLayer.defaultProps = {
};

export default MapLayer;
