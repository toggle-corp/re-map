import { useContext, useEffect, useRef } from 'react';

import { MapChildContext } from './context';

interface Props {
    bounds: mapboxgl.LngLatBoundsLike | undefined;
    padding: number | mapboxgl.PaddingOptions;
    duration: number;
}

function MapBounds(props: Props) {
    const { map, setBounds } = useContext(MapChildContext);
    const {
        padding = 0,
        duration: durationFromProps = 200,
        bounds,
    } = props;

    const durationRef = useRef(durationFromProps);
    useEffect(
        () => {
            durationRef.current = durationFromProps;
        },
        [durationFromProps],
    );

    // Handle change in bounds
    useEffect(
        () => {
            if (!map || !bounds) {
                return;
            }

            const duration = durationRef.current;

            setBounds(bounds, padding, duration);

            map.fitBounds(
                bounds,
                {
                    padding,
                    duration,
                },
            );
        },
        [map, bounds, padding, setBounds],
    );

    return null;
}

export default MapBounds;
