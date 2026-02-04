import { create } from "zustand";

type State = {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;
};

export const useHecrasMap = create<State>((set) => ({
  map: null,
  setMap: (map) =>
    set({
      map: map,
    }),
}));
