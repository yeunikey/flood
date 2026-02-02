import { create } from "zustand";
import HecRas from "@/entities/hec-ras/types/hec-ras";
import Pool from "@/entities/pool/types/pool";

export interface MapMetadata {
  bounds?: [number, number, number, number];
  center?: [number, number];
  minzoom?: number;
  maxzoom?: number;
  has_time?: boolean;
}

type State = {
  activePools: Pool[];
  activeHecras: HecRas | null;
  metadata: MapMetadata | null;
  times: string[];
  currentTimeIndex: number;
  isPlaying: boolean;
  isMapLoaded: boolean;

  setActivePools: (activePools: Pool[]) => void;
  setActiveHecras: (hecRas: HecRas | null) => void;
  setMetadata: (metadata: MapMetadata | null) => void;
  setTimes: (times: string[]) => void;
  setCurrentTimeIndex: (index: number | ((prev: number) => number)) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsMapLoaded: (isMapLoaded: boolean) => void;
};

export const useHecrasStore = create<State>((set) => ({
  activeHecras: null,
  metadata: null,
  times: [],
  currentTimeIndex: 0,
  isPlaying: false,
  isMapLoaded: false,

  activePools: [],
  setActivePools: (activePools: Pool[]) =>
    set({
      activePools,
    }),

  setActiveHecras: (hecRas) =>
    set({
      activeHecras: hecRas,
      metadata: null,
      times: [],
      currentTimeIndex: 0,
      isPlaying: false,
    }),
  setMetadata: (metadata) => set({ metadata }),
  setTimes: (times) => set({ times }),
  setCurrentTimeIndex: (updater) =>
    set((state) => ({
      currentTimeIndex:
        typeof updater === "function"
          ? updater(state.currentTimeIndex)
          : updater,
    })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsMapLoaded: (isMapLoaded) => set({ isMapLoaded }),
}));
