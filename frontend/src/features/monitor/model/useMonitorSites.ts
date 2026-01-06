import Pool from "@/entities/pool/types/pool";
import Site from "@/entities/site/types/site";
import { create } from "zustand";

type State = {
    activeSites: Site[];
    setActiveSites: (sites: Site[]) => void;

    activePools: Pool[];
    setActivePools: (activePools: Pool[]) => void;
};

export const useMonitorSites = create<State>((set) => ({
    activeSites: [],
    setActiveSites: (sites) => set({ activeSites: sites }),

    activePools: [],
    setActivePools: (activePools: Pool[]) => set({
        activePools
    })
}));