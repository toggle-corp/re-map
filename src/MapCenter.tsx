import { useContext, useEffect, useRef } from 'react';

import { MapChildContext } from './context';

interface Props {
    center: mapboxgl.LngLatLike | undefined;
    centerOptions: Omit<mapboxgl.FlyToOptions, 'center'>;
}

function MapCenter(props: Props) {
    const { map } = useContext(MapChildContext);
    const {
        center,
        centerOptions,
    } = props;

    const centerOptionsRef = useRef(centerOptions);

    useEffect(
        () => {
            centerOptionsRef.current = centerOptions;
        },
        [centerOptions],
    );

    // Handle change in center
    useEffect(
        () => {
            if (!map || !center) {
                return;
            }

            map.flyTo({
                center,
                ...centerOptionsRef.current,
            });
        },
        [map, center],
    );

    return null;
}

export default MapCenter;
