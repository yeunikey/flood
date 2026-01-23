import { create } from "zustand";
import { Spatial } from "../types/spatial";

type State = {
  spatials: Spatial[];
  setSpatials: (spatials: Spatial[]) => void;
};

export const useSpatial = create<State>((set) => ({
  spatials: [],
  setSpatials: (spatials) => set({ spatials }),
}));
