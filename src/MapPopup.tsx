import React, {
    useContext, useEffect, useRef, useState,
} from 'react';
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
    popupOptions?: mapboxgl.PopupOptions;
    trackPointer: boolean;
}

function MapPopup(props: Props) {
    const { map } = useContext(MapChildContext);
    const {
        children,
        coordinates,
        hidden = false,
        popupOptions,
        onHide,
        trackPointer = false,
    } = props;

    // const popupUpdateTimeoutRef = useRef<number | undefined>();
    const popupContainerRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);

    const [initialPopupOptions] = useState(popupOptions);
    const [initialTrackPointer] = useState(trackPointer);
    const [initialCoordinates] = useState(coordinates);

    // Create popup <div>
    useEffect(
        () => {
            const div = document.createElement('div');
            popupContainerRef.current = div;
            return () => {
                div.remove();
            };
        },
        [],
    );

    // Render react component in popup <div>
    useEffect(
        () => {
            if (!map) {
                return;
            }
            ReactDOM.render(
                children,
                popupContainerRef.current,
            );
        },
        [map, children],
    );

    // Create mapbox popup and assign to popup <div>
    useEffect(
        () => {
            if (!map || !popupContainerRef.current || hidden) {
                return noop;
            }

            const popup = new mapboxgl.Popup(initialPopupOptions);

            if (initialCoordinates) {
                popup.setLngLat(initialCoordinates);
            }
            if (initialTrackPointer) {
                popup.trackPointer();
            }

            popup.setDOMContent(popupContainerRef.current);
            popup.addTo(map);

            popupRef.current = popup;

            return () => {
                popup.remove();
                popupRef.current = null;
            };
        },
        [map, hidden, initialPopupOptions, initialTrackPointer, initialCoordinates],
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

            const popup = popupRef.current;

            const onClose = () => {
                if (onHide) {
                    onHide();
                }
            };
            popup.on('close', onClose);
            return () => {
                popup.off('close', onClose);
                if (popup.isOpen()) {
                    popup.remove();
                }
            };
        },
        [map, onHide],
    );

    return null;
}

export default MapPopup;
