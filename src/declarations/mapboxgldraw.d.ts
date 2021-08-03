declare module '@mapbox/mapbox-gl-draw' {
    import { IControl } from 'mapbox-gl';

    export interface IMapboxDrawControls {
        point?: boolean,
        // eslint-disable-next-line camelcase
        line_string?: boolean,
        polygon?: boolean
        trash?: boolean,
        // eslint-disable-next-line camelcase
        combine_features?: boolean,
        // eslint-disable-next-line camelcase
        uncombine_features?: boolean
    }

    class MapboxDraw implements IControl {
        getDefaultPosition: () => string

        constructor(options?: {
            displayControlsDefault?: boolean,
            keybindings?: boolean,
            touchEnabled?: boolean,
            boxSelect?: boolean,
            clickBuffer?: number,
            touchBuffer?: number,
            controls?: IMapboxDrawControls,
            styles?: Record<string, unknown>[],
            modes?: Record<string, unknown>,
            defaultMode?: string,
            userProperties?: boolean
        });

        public add(geojson: Record<string, unknown>): string[]

        public get(featureId: string): GeoJSON.Feature | undefined

        public getFeatureIdsAt(point: { x: number, y: number }): string[]

        public getSelectedIds(): string[]

        public getSelected(): GeoJSON.FeatureCollection

        public getSelectedPoints(): GeoJSON.FeatureCollection

        public getAll(): GeoJSON.FeatureCollection

        public delete(ids: string | string[]): this

        public deleteAll(): this

        public set(featureCollection: GeoJSON.FeatureCollection): string[]

        public trash(): this

        public combineFeatures(): this

        public uncombineFeatures(): this

        public getMode(): string

        public changeMode(mode: string, options?: Record<string, unknown>): this

        public setFeatureProperty(featureId: string, property: string, value: any): this

        onAdd(map: mapboxgl.Map): HTMLElement

        onRemove(map: mapboxgl.Map): any
    }

    export default MapboxDraw;
}
