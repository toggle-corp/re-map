// eslint-disable-next-line import/prefer-default-export
export function getLayerName(sourceKey: string, layerKey: string, managed: boolean) {
    if (!managed) {
        return layerKey;
    }
    return `${sourceKey}›${layerKey}`;
}
