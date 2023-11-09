import {
    useContext, useEffect, useState, useRef,
} from 'react';
import { difference } from '@togglecorp/fujs';

import { SourceChildContext } from '../context';

function usePreviousValue<T>(value: T, initialValue: T) {
    const ref = useRef<T>(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props<T> {
    sourceLayer?: string;
    attributeKey: string;
    attributes: { id: number; value: T }[];
}

const emptyAttributes: { id: number, value: unknown }[] = [];

function MapState<T>(props: Props<T>) {
    const {
        sourceLayer,
        attributeKey,
        attributes = emptyAttributes,
    } = props;

    const {
        map,
        mapStyle,

        sourceKey,
        isSourceDefined,
        isMapDestroyed,
        debug,
    } = useContext(SourceChildContext);

    const [initialAttributes] = useState(attributes);
    const [initialDebug] = useState(debug);

    const prevAttributes = usePreviousValue(attributes, []);
    const prevSourceLayer = usePreviousValue(sourceLayer, undefined);

    // Handle attributes change
    useEffect(
        () => {
            if (!map || !sourceKey) {
                return noop;
            }

            if (initialDebug) {
                // eslint-disable-next-line no-console
                console.warn(`Setting source state: "${sourceKey}" with "${sourceLayer || 'no'}" source layer.`);
            }

            initialAttributes.forEach((attribute) => {
                map.setFeatureState(
                    {
                        id: attribute.id,
                        source: sourceKey,
                        sourceLayer,
                    },
                    { [attributeKey]: attribute.value },
                );
            });

            return () => {
                if (!isMapDestroyed() && isSourceDefined(sourceKey)) {
                    if (initialDebug) {
                        // eslint-disable-next-line no-console
                        console.warn(`Removing source state: "${sourceKey}" with "${sourceLayer || 'no'}" source layer.`);
                    }
                    initialAttributes.forEach((attribute) => {
                        map.removeFeatureState(
                            {
                                id: attribute.id,
                                source: sourceKey,
                                sourceLayer,
                            },
                            attributeKey,
                        );
                    });
                }
            };
        },
        [
            map, mapStyle,
            sourceKey, sourceLayer,
            attributeKey, initialAttributes,
            isSourceDefined, isMapDestroyed,
            initialDebug,
        ],
    );

    useEffect(
        () => {
            if (!map || !sourceKey) {
                return;
            }
            if (sourceLayer !== prevSourceLayer) {
                prevAttributes.forEach((attribute) => {
                    map.removeFeatureState(
                        {
                            id: attribute.id,
                            source: sourceKey,
                            sourceLayer: prevSourceLayer,
                        },
                        attributeKey,
                    );
                });

                attributes.forEach((attribute) => {
                    map.setFeatureState(
                        {
                            id: attribute.id,
                            source: sourceKey,
                            sourceLayer,
                        },
                        { [attributeKey]: attribute.value },
                    );
                });
                return;
            }

            const toBeDeleted = difference(new Set(prevAttributes), new Set(attributes));
            const toBeAddedModified = difference(new Set(attributes), toBeDeleted);

            toBeDeleted.forEach((attribute) => {
                map.removeFeatureState(
                    {
                        id: attribute.id,
                        source: sourceKey,
                        sourceLayer,
                    },
                    attributeKey,
                );
            });
            toBeAddedModified.forEach((attribute) => {
                map.setFeatureState(
                    {
                        id: attribute.id,
                        source: sourceKey,
                        sourceLayer,
                    },
                    { [attributeKey]: attribute.value },
                );
            });
        },
        [map, sourceKey, attributes, prevAttributes, attributeKey, sourceLayer, prevSourceLayer],
    );

    return null;
}

export default MapState;
