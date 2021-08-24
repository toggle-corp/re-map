import { useContext, useEffect, useRef } from 'react';

import { MapChildContext } from './context';

interface Props {
    bounds: mapboxgl.LngLatBoundsLike | undefined;
    padding: number | mapboxgl.PaddingOptions;
    duration: number;
}

const MapBounds = (props: Props) => {
    const { map, setBounds } = useContext(MapChildContext);
    const {
        padding,
        duration: durationFromProps,
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
};

MapBounds.defaultProps = {
    padding: 0,
    duration: 200, // ms
};

export default MapBounds;
