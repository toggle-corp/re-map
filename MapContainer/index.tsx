import React, { useContext, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';

import { MapChildContext } from '../context';
import useDimension from '../useDimension';

import styles from './styles.css';
// import styles from './styles.scss';

interface Props {
    className?: string;
}

// TODO: make container responsive
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
            className={_cs(className, styles.map)}
        />
    );
};

export default MapContainer;
