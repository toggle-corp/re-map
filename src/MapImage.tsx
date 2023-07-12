import { useContext, useEffect, useState } from 'react';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

type Props = {
    name: string;
    url?: string;
    image?: Img;
    imageOptions?: { pixelRatio?: number; sdf?: boolean };
    onLoad?: (loaded: boolean) => void;
}

type Img = HTMLImageElement
| ArrayBufferView
| { width: number; height: number; data: Uint8Array | Uint8ClampedArray }
| ImageData;

function MapImage(props: Props) {
    const {
        map,
        mapStyle,
        isMapDestroyed,
    } = useContext(MapChildContext);

    const {
        name,
        url,
        image,
        imageOptions,
        onLoad,
    } = props;

    const [initialName] = useState(name);
    const [initialUrl] = useState(url);
    const [initialImage] = useState(image);
    const [initialImageOptions] = useState(imageOptions);

    useEffect(
        () => {
            if (!map || !mapStyle) {
                return noop;
            }

            if (map.hasImage(initialName)) {
                // eslint-disable-next-line no-console
                console.error(`An image with name '${initialName}' already exists`);
            } else if (initialUrl) {
                if (onLoad) {
                    onLoad(false);
                }
                map.loadImage(
                    initialUrl,
                    (error: unknown, loadedImage: Img) => {
                        if (isMapDestroyed()) {
                            return;
                        }
                        if (error) {
                            // eslint-disable-next-line no-console
                            console.error(error);
                            return;
                        }
                        map.addImage(initialName, loadedImage, initialImageOptions);
                        if (onLoad) {
                            onLoad(true);
                        }
                    },
                );
            } else if (initialImage) {
                map.addImage(initialName, initialImage, initialImageOptions);
                if (onLoad) {
                    onLoad(true);
                }
            }

            return () => {
                if (!isMapDestroyed() && map.hasImage(initialName)) {
                    map.removeImage(initialName);
                    if (onLoad) {
                        onLoad(false);
                    }
                }
            };
        },
        [
            map, mapStyle, isMapDestroyed,
            initialName, initialImage, initialUrl, initialImageOptions,
            onLoad,
        ],
    );

    return null;
}

export default MapImage;
