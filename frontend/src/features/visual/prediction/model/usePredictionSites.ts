import Pool from "@/entities/pool/types/pool";
import Site from "@/entities/site/types/site";
import { create } from "zustand";
import { ForecastQuery } from "./forecast.types";

type State = {
  activeSite: Site | null;
  setActiveSite: (site: Site | null) => void;

  activePools: Pool[];
  setActivePools: (activePools: Pool[]) => void;

  forecastQuery: ForecastQuery | null;
  setForecastQuery: (query: ForecastQuery | null) => void;
};

export const usePredictionSites = create<State>((set) => ({
  activeSite: null,
  setActiveSite: (site) => set({ activeSite: site, forecastQuery: null }),

  activePools: [],
  setActivePools: (activePools) => set({ activePools }),

  forecastQuery: null,
  setForecastQuery: (forecastQuery) => set({ forecastQuery }),
}));
