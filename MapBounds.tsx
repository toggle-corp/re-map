import { useContext, useEffect, useState } from 'react';

import { MapChildContext } from './context';

interface Props {
    bounds?: [number, number, number, number];
    padding: number;
    duration: number;
}

const MapBounds = (props: Props) => {
    const { map } = useContext(MapChildContext);
    const {
        padding,
        duration,
        bounds,
    } = props;

    const [initialPadding] = useState(padding);
    const [initialDuration] = useState(duration);

    // Handle change in bounds
    useEffect(
        () => {
            if (!map || !bounds) {
                return;
            }

            const [fooLon, fooLat, barLon, barLat] = bounds;
            map.fitBounds(
                [[fooLon, fooLat], [barLon, barLat]],
                {
                    padding: initialPadding,
                    duration: initialDuration,
                },
            );
        },
        [map, bounds, initialPadding, initialDuration],
    );

    return null;
};


MapBounds.defaultProps = {
    padding: 0,
    duration: 200, // ms
};

export default MapBounds;
