import { create } from "zustand";
import HecRas from "../types/hec-ras";

type HecRasState = {
  hecRas: HecRas[];
  setHecRas: (methods: HecRas[]) => void;
};

export const useHecRas = create<HecRasState>((set) => ({
  hecRas: [],
  setHecRas: (hecRas) => set({ hecRas }),
}));
