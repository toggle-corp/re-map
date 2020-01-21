import React, { useContext, useEffect } from 'react';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props {
    src: string;
    iconKey: string;
}

const MapIcon = (props: Props) => {
    const { map } = useContext(MapChildContext);
    const {
        src,
        iconKey,
    } = props;


    useEffect(
        () => {
            if (!map) {
                return noop;
            }

            return () => {
                if (!map.hasImage(iconKey)) {
                    map.loadImage(src, (error, image) => {
                        if (error) {
                            console.error('failed to load map icon', iconKey, src, error);
                        } else {
                            map.addImage(iconKey, image);
                        }
                    });
                }
            };
        },
    );

    return null;
};

export default MapIcon;
