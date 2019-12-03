import React, { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import { MapChildContext } from '../context';
import styles from './styles.scss';

interface Props {
    className?: string;
}

// TODO: make container responsive
const MapContainer = (props: Props) => {
    const { className } = props;
    const { mapContainerRef } = useContext(MapChildContext);

    return (
        <div
            ref={mapContainerRef}
            className={_cs(className, styles.map)}
        />
    );
};

export default MapContainer;
