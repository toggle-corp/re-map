import React, {
    useContext,
    useEffect,
    useRef,
    useState,
    useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import {
    type LngLatLike,
    type PopupOptions,
    Popup,
} from 'maplibre-gl';

import { MapChildContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// TODO: add mapStyle if necessary
interface Props {
    children: React.ReactElement;
    coordinates: LngLatLike;
    hidden: boolean;
    onHide?: () => void;
    popupOptions?: PopupOptions;
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

    const popupRef = useRef<Popup | null>(null);

    const [initialPopupOptions] = useState(popupOptions);
    const [initialTrackPointer] = useState(trackPointer);
    const [initialCoordinates] = useState(coordinates);

    // Create popup <div>
    const div = useMemo(
        () => document.createElement('div'),
        [],
    );

    // Create mapbox popup and assign to popup <div>
    useEffect(
        () => {
            if (!map || hidden) {
                return noop;
            }

            const popup = new Popup(initialPopupOptions);

            if (initialCoordinates) {
                popup.setLngLat(initialCoordinates);
            }
            if (initialTrackPointer) {
                popup.trackPointer();
            }

            popup.setDOMContent(div);
            popup.addTo(map);

            popupRef.current = popup;

            return () => {
                popupRef.current = null;
            };
        },
        [map, hidden, initialPopupOptions, initialTrackPointer, initialCoordinates, div],
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

    return (
        <>
            {createPortal(children, div)}
        </>
    );
}

export default MapPopup;
