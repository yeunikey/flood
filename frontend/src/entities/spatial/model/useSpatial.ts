import { create } from "zustand";
import { SpatialResponse } from "../types/spatial";

type State = {
  spatials: SpatialResponse[];
  setSpatials: (spatials: SpatialResponse[]) => void;
};

export const useSpatial = create<State>((set) => ({
  spatials: [],
  setSpatials: (spatials) => set({ spatials }),
}));
