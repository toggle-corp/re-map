import { useContext, useEffect } from 'react';

import { MapChildContext } from './context';

interface Props {
    bounds?: [number, number, number, number];
    padding: number;
    duration: number;
}

const MapContainer = (props: Props) => {
    const { map } = useContext(MapChildContext);
    const {
        padding,
        duration,
        bounds,
    } = props;

    useEffect(
        () => {
            if (!map || !bounds) {
                return;
            }

            const [fooLon, fooLat, barLon, barLat] = bounds;
            map.fitBounds(
                [[fooLon, fooLat], [barLon, barLat]],
                {
                    padding,
                    duration,
                },
            );
        },
        [map, bounds],
    );

    return null;
};


MapContainer.defaultProps = {
    padding: 0,
    duration: 200, // ms
};

export default MapContainer;
