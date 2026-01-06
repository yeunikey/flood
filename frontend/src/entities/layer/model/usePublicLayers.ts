import { create } from "zustand";

type State = {
    layers: {
        lakesRivers: boolean;
        regionBorders: boolean;
    };

    toggleLayer: (key: keyof State['layers']) => void;
    setLayerStates: (states: Partial<State['layers']>) => void;
};

export const usePublicLayers = create<State>((set) => ({
    layers: {
        lakesRivers: false,
        regionBorders: false,
    },

    toggleLayer: (key) =>
        set((state) => ({
            layers: {
                ...state.layers,
                [key]: !state.layers[key],
            },
        })),
    setLayerStates: (states) =>
        set((state) => ({
            layers: { ...state.layers, ...states },
        })),
}));
