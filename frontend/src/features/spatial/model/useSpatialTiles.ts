import Pool from "@/entities/pool/types/pool";
import { Spatial } from "@/entities/spatial/types/spatial";
import { create } from "zustand";

type State = {
  activeSpatial: Spatial | null;
  setActiveSpatial: (spatial: Spatial | null) => void;

  activeTileId: string | null;
  setActiveTileId: (id: string | null) => void;

  activePools: Pool[];
  setActivePools: (activePools: Pool[]) => void;
};

export const useSpatialTiles = create<State>((set) => ({
  activeSpatial: null,
  setActiveSpatial: (spatial) =>
    set({ activeSpatial: spatial, activeTileId: spatial?.tileIds[0] || null }),

  activeTileId: null,
  setActiveTileId: (id) => set({ activeTileId: id }),

  activePools: [],
  setActivePools: (activePools: Pool[]) =>
    set({
      activePools,
    }),
}));
