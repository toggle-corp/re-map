import {
    useContext,
    useEffect,
    useState,
    useRef,
} from 'react';
import { Map } from 'maplibre-gl';

import { MapChildContext } from './context';

type AddImageParams = Parameters<Map['addImage']>;

type Name = NonNullable<AddImageParams[0]>;
type Img = NonNullable<AddImageParams[1]>;
type ImageOptions = NonNullable<AddImageParams[2]>;

type Props<NAME extends Name> = {
    name: NAME;
    url?: string;
    image?: Img;
    imageOptions?: ImageOptions;
    onLoad?: (loaded: boolean, name: NAME) => void;
}

function MapImage<NAME extends Name>(props: Props<NAME>) {
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

    const mountedRef = useRef(true);

    const [initialName] = useState(name);
    const [initialUrl] = useState(url);
    const [initialImage] = useState(image);
    const [initialImageOptions] = useState(imageOptions);

    useEffect(
        () => {
            mountedRef.current = true;
            return () => {
                mountedRef.current = false;
            };
        },
        [],
    );

    useEffect(
        () => {
            if (!map || !mapStyle || (!initialUrl && !initialImage)) {
                return undefined;
            }

            if (map.hasImage(initialName)) {
                // eslint-disable-next-line no-console
                console.error(`An image with name '${initialName}' already exists`);
                return undefined;
            }

            if (initialUrl) {
                map.loadImage(
                    initialUrl,
                    (error, loadedImage) => {
                        if (error) {
                            // eslint-disable-next-line no-console
                            console.error(error);
                            return;
                        }
                        if (!loadedImage) {
                            // eslint-disable-next-line no-console
                            console.error('Failed to load image');
                            return;
                        }

                        if (!mountedRef.current || isMapDestroyed()) {
                            return;
                        }

                        map.addImage(initialName, loadedImage, initialImageOptions);
                        if (onLoad) {
                            onLoad(true, initialName);
                        }
                    },
                );
            } else if (initialImage) {
                map.addImage(initialName, initialImage, initialImageOptions);
                if (onLoad) {
                    onLoad(true, initialName);
                }
            }

            return () => {
                if (!isMapDestroyed() && map.hasImage(initialName)) {
                    map.removeImage(initialName);
                    if (onLoad) {
                        onLoad(false, initialName);
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
