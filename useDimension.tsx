import { useRef, useState, useEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { randomString } from '@togglecorp/fujs';

interface ResizeHandler {
    (rect: ClientRect): void;
}

interface ResizeHandlers {
    [key: string]: ResizeHandler;
}

const resizeHandlers: ResizeHandlers = {};

const handleResize: ResizeObserverCallback = (entries) => {
    entries.forEach((entry) => {
        const element = entry.target;
        const key = element.dataset.resizeHandlerKey;
        if (key && resizeHandlers[key]) {
            const { contentRect: rect } = entry;
            resizeHandlers[key](rect);
        }
    });
};

const observer = new ResizeObserver(handleResize);

const addResizeHandler = (ref: React.RefObject<HTMLDivElement>, callback: ResizeHandler) => {
    const key = randomString(16);
    if (!ref.current) {
        return;
    }
    // eslint-disable-next-line no-param-reassign
    ref.current.dataset.resizeHandlerKey = key;
    resizeHandlers[key] = callback;
    observer.observe(ref.current);
};

const removeResizeHandler = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) {
        return;
    }

    observer.unobserve(ref.current);
    const key = ref.current.dataset.resizeHandlerKey;
    if (!key || !resizeHandlers[key]) {
        return;
    }
    delete resizeHandlers[key];
};

const useDimension = (
    targetRef: React.RefObject<HTMLDivElement> | undefined,
    debounceDuration = 200,
) => {
    const timeoutRef = useRef<number | undefined>();
    const [rect, setRect] = useState<ClientRect | undefined>(undefined);

    useEffect(
        () => {
            if (!targetRef) {
                return () => {
                    // noop
                };
            }

            addResizeHandler(
                targetRef,
                (r: ClientRect) => {
                    window.clearTimeout(timeoutRef.current);

                    timeoutRef.current = window.setTimeout(
                        () => {
                            const different = (
                                !rect
                                // || r.x !== rect.x
                                // || r.y !== rect.y
                                || r.width !== rect.width
                                || r.height !== rect.height
                                || r.top !== rect.top
                                || r.right !== rect.right
                                || r.bottom !== rect.bottom
                                || r.left !== rect.left
                            );
                            if (different) {
                                setRect(r);
                            }
                        },
                        debounceDuration,
                    );
                },
            );
            return () => {
                window.clearTimeout(timeoutRef.current);
                removeResizeHandler(targetRef);
            };
        },
    );
    return rect;
};

export default useDimension;
