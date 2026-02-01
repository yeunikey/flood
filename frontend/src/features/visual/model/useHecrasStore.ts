import { create } from "zustand";
import HecRas from "@/entities/hec-ras/types/hec-ras";

export interface MapMetadata {
  bounds?: [number, number, number, number];
  center?: [number, number];
  minzoom?: number;
  maxzoom?: number;
  has_time?: boolean;
}

type State = {
  activeHecras: HecRas | null;
  metadata: MapMetadata | null;
  times: string[];
  currentTimeIndex: number;
  isPlaying: boolean;
  isMapLoaded: boolean;

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
