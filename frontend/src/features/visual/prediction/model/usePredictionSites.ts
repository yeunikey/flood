import Pool from "@/entities/pool/types/pool";
import Site from "@/entities/site/types/site";
import { create } from "zustand";

type State = {
  activeSite: Site | null;
  setActiveSite: (site: Site | null) => void;

  activePools: Pool[];
  setActivePools: (activePools: Pool[]) => void;
};

export const usePredictionSites = create<State>((set) => ({
  activeSite: null,
  setActiveSite: (site) => set({ activeSite: site }),

  activePools: [],
  setActivePools: (activePools) => set({ activePools }),
}));
