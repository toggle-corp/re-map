import React, { useContext, useEffect } from 'react';

import { MapChildContext } from '../context';
import useDimension from './useDimension';

interface Props {
    className?: string;
}

const MapContainer = (props: Props) => {
    const { className } = props;
    const { mapContainerRef, map } = useContext(MapChildContext);
    const rect = useDimension(mapContainerRef);

    useEffect(
        () => {
            if (map) {
                map.resize();
            }
        },
        [rect, map],
    );

    return (
        <div
            ref={mapContainerRef}
            className={className}
            style={{
                padding: 0,
            }}
        />
    );
};

export default MapContainer;
