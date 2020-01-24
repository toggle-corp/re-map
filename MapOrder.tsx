import { useContext, useEffect, useState } from 'react';

import { MapChildContext } from './context';

interface Props {
    ordering: string[] | undefined;
}

const MapOrder = (props: Props) => {
    const { map } = useContext(MapChildContext);
    const {
        ordering,
    } = props;

    useEffect(
        () => {
            if (!map || !ordering) {
                return;
            }

            // NOTE: just to be safe, only try ordering layers that are mounted
            const validLayerIdentifiers = ordering.filter(
                layerIdentifier => !!map.getLayer(layerIdentifier),
            );

            for (let i = 0; i < validLayerIdentifiers.length - 1; i += 1) {
                map.moveLayer(validLayerIdentifiers[i], validLayerIdentifiers[i + 1]);
            }
        },
        [map, ordering],
    );

    return null;
};


MapOrder.defaultProps = {
};

export default MapOrder;
