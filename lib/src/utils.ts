import {
    type SourceSpecification,
    type GeoJSONSourceSpecification,
    type Source,
    type GeoJSONSource,
} from 'maplibre-gl';

export function getLayerName(sourceKey: string, layerKey: string, managed: boolean) {
    if (!managed) {
        return layerKey;
    }
    return `${sourceKey}›${layerKey}`;
}

type ModifiedSourceSpecification = Exclude<SourceSpecification, GeoJSONSourceSpecification> | Omit<GeoJSONSourceSpecification, 'data'>;

export function isGeoJSONSourceSpecification(
    s: ModifiedSourceSpecification,
): s is Omit<GeoJSONSourceSpecification, 'data'> {
    return !!s && s.type === 'geojson';
}

export function isGeoJSONSource(
    s: Source,
): s is GeoJSONSource {
    return !!s && s.type === 'geojson';
}
