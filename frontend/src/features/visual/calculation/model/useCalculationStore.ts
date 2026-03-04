import Pool from "@/entities/pool/types/pool";
import { create } from "zustand";
import { Calculation } from "./calculations";

type State = {
  activePools: Pool[];
  activeCalculation: Calculation | null;
  isMapLoaded: boolean;

  setActivePools: (activePools: Pool[]) => void;
  setActiveCalculations: (calculation: Calculation | null) => void;
  setIsMapLoaded: (isMapLoaded: boolean) => void;
};

export const useCalculationStore = create<State>((set) => ({
  activeCalculation: null,
  activePools: [],
  isMapLoaded: false,

  setActivePools: (activePools: Pool[]) =>
    set({
      activePools,
    }),
  setActiveCalculations: (activeCalculations: Calculation | null) =>
    set({ activeCalculation: activeCalculations }),
  setIsMapLoaded: (isMapLoaded) => set({ isMapLoaded }),
}));
