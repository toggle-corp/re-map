import { useContext, useEffect, useState } from 'react';

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
        duration,
        bounds,
    } = props;

    const [initialDuration] = useState(duration);

    // Handle change in bounds
    useEffect(
        () => {
            if (!map || !bounds) {
                return;
            }

            setBounds(bounds, padding, initialDuration);

            map.fitBounds(
                bounds,
                {
                    padding,
                    duration: initialDuration,
                },
            );
        },
        [map, bounds, padding, initialDuration, setBounds],
    );

    return null;
};

MapBounds.defaultProps = {
    padding: 0,
    duration: 200, // ms
};

export default MapBounds;
