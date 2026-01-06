import { create } from "zustand";
import Layer from "../types/layer";

type LayerState = {
    layers: Layer[];
    setLayers: (methods: Layer[]) => void;
};

export const useLayers = create<LayerState>((set) => ({
    layers: [],
    setLayers: (layers) => set({ layers }),
}));
