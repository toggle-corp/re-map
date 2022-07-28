import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// TODO: add mapStyle if necessary
interface Props {
    children: React.ReactElement;
    coordinates: mapboxgl.LngLatLike;
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

    const popupRef = useRef<mapboxgl.Popup | null>(null);

    const [initialTooltipOptions] = useState(tooltipOptions);
    const [initialTrackPointer] = useState(trackPointer);
    const [initialCoordinates] = useState(coordinates);

    // Render react component in tooltip <div>
    useEffect(
        () => {
            if (!map) {
                return;
            }
            const elem = document.getElementsByClassName('THISISIT')[0];
            if (!elem) {
                return;
            }

            ReactDOM.createPortal(
                children,
                elem,
            );
        },
        [map, children],
    );

    // Create mapbox popup and assign to tooltip <div>
    useEffect(
        () => {
            if (!map || hidden) {
                return noop;
            }

            popupRef.current = new mapboxgl.Popup({ ...initialTooltipOptions, className: 'THISISIT' });

            if (initialCoordinates) {
                popupRef.current.setLngLat(initialCoordinates);
            }
            if (initialTrackPointer) {
                popupRef.current.trackPointer();
            }

            // popupRef.current.setDOMContent(tooltipContainerRef.current);
            popupRef.current.addTo(map);

            return () => {
                if (popupRef.current) {
                    popupRef.current.remove();
                    popupRef.current = null;
                }
            };
        },
        [map, hidden, initialTooltipOptions, initialTrackPointer, initialCoordinates],
    );

    // Handle coordinates change
    useEffect(
        () => {
            if (!map || !popupRef.current || !coordinates || initialTrackPointer) {
                return;
            }
            popupRef.current.setLngLat(coordinates);
        },
        [map, coordinates, initialTrackPointer],
    );

    // Handle onHide change
    useEffect(
        () => {
            if (!map || !popupRef.current) {
                return noop;
            }
            popupRef.current.on('close', () => {
                if (onHide) {
                    onHide();
                }
            });
            return () => {
                if (popupRef.current) {
                    popupRef.current.off('close');
                }
            };
        },
        [map, onHide],
    );

    return null;
};

MapTooltip.defaultProps = {
    hidden: false,
    trackPointer: false,
};

export default MapTooltip;
