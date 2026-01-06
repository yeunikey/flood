import { create } from "zustand";

type State = {
    map: mapboxgl.Map | null;
    setMap: (map: mapboxgl.Map | null) => void;
};

export const useMonitorMap = create<State>((set) => ({
    map: null,
    setMap: (map) => set({
        map: map
    }),
}));