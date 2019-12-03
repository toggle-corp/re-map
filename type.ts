interface Obj<T> {
    [key: string]: T;
}

export interface Layer {
    name: string;
    // sourceName: string;
    destroy: () => void;
}

export interface Source {
    name: string;
    destroy: () => void;
    layers: Obj<Layer>;
}

export type Sources = Obj<Source>;
