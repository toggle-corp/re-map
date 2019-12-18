import React, { useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface Props {
    children: React.ReactElement;
    coordinates: [number, number];
    hidden: boolean;
    onHide?: () => void;
    tooltipOptions?: mapboxgl.PopupOptions;
    trackPointer: boolean;
}

const MapTooltip = (props: Props) => {
    const { map } = useContext(MapChildContext);
    const {
        children,
        coordinates,
        hidden,
        tooltipOptions,
        onHide,
        trackPointer,
    } = props;

    const tooltipContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(
        () => {
            if (!map || hidden) {
                return noop;
            }
            tooltipContainerRef.current = document.createElement('div');

            ReactDOM.render(
                children,
                tooltipContainerRef.current,
            );

            const popup = new mapboxgl.Popup(tooltipOptions)
                .setLngLat(coordinates)
                .setDOMContent(tooltipContainerRef.current)
                .addTo(map);

            if (trackPointer) {
                popup.trackPointer();
            }

            popup.on('close', () => {
                if (onHide) {
                    onHide();
                }
            });

            return () => {
                popup.remove();

                if (tooltipContainerRef.current) {
                    tooltipContainerRef.current.remove();
                }
            };
        },
        [map, hidden],
    );
    useEffect(
        () => {
            if (!map || hidden) {
                return;
            }
            ReactDOM.render(
                children,
                tooltipContainerRef.current,
            );
        },
        [children],
    );

    return null;
};


MapTooltip.defaultProps = {
    hidden: false,
    trackPointer: false,
};

export default MapTooltip;
