import { useContext, useEffect } from 'react';

import { SourceChildContext } from '../context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props<T> {
    sourceLayer?: string;
    attributeKey: string;
    attributes: { id: number; value: T }[];
}

function MapState<T>(props: Props<T>) {
    const {
        sourceLayer,
        attributeKey,
        attributes,
    } = props;

    const {
        map,
        mapStyle,

        sourceKey,
        isSourceDefined,
    } = useContext(SourceChildContext);

    useEffect(
        () => {
            if (!map || !sourceKey) {
                return noop;
            }

            // eslint-disable-next-line max-len
            // console.warn(`Setting source state: "${sourceKey}" with "${sourceLayer || 'no'}" source layer.`);

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

            return () => {
                if (isSourceDefined(sourceKey)) {
                    attributes.forEach((attribute) => {
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
        [map, mapStyle, sourceKey, sourceLayer, attributeKey, attributes],
    );

    return null;
}


MapState.defaultProps = {
    attributes: [],
};

export default MapState;
