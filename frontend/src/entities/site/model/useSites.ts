import { create } from "zustand";
import Site from "../types/site";

type SitesState = {
    sites: Site[];
    setSites: (sites: Site[]) => void;
};

export const useSites = create<SitesState>((set) => ({
    sites: [],
    setSites: (qcls) => set({ sites: qcls }),
}));
