import { useContext, useEffect, useState } from 'react';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type Props = {
    name: string;
    url: string;
    imageOptions?: { pixelRatio?: number; sdf?: boolean };
} | {
    name: string;
    image: Img;
    imageOptions?: { pixelRatio?: number; sdf?: boolean };
}

type Img = HTMLImageElement
| ArrayBufferView
| { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
| ImageData;

const MapImage = (props: Props) => {
    const { map, isMapDestroyed } = useContext(MapChildContext);
    const {
        name,
        url,
        image,
        imageOptions,
    } = props;

    const [initialName] = useState(name);
    const [initialUrl] = useState(url);
    const [initialImageOptions] = useState(imageOptions);

    // Handle change in bounds
    useEffect(
        () => {
            if (!map) {
                return noop;
            }

            if (map.hasImage(initialName)) {
                console.error(`An image with name '${initialName}' already exists`);
            } else if (initialUrl) {
                map.loadImage(
                    initialUrl,
                    (error: unknown, loadedImage: Img) => {
                        if (isMapDestroyed()) {
                            return;
                        }
                        if (error) {
                            console.error(error);
                            return;
                        }
                        map.addImage(initialName, loadedImage, initialImageOptions);
                    },
                );
            } else if (image) {
                map.addImage(initialName, image, initialImageOptions);
            }

            return () => {
                if (!isMapDestroyed() && map.hasImage(initialName)) {
                    map.removeImage(initialName);
                }
            };
        },
        [map, initialName, image, initialUrl, initialImageOptions, isMapDestroyed],
    );

    return null;
};


MapImage.defaultProps = {
};

export default MapImage;
