import Pool from "@/entities/pool/types/pool";
import Tile from "@/entities/tiles/types/tile";
import { create } from "zustand";

type State = {
    activeTile: Tile | null;
    setActiveTile: (tile: Tile | null) => void;

    activePools: Pool[];
    setActivePools: (activePools: Pool[]) => void;
};

export const useSpatialTiles = create<State>((set) => ({
    activeTile: null,
    setActiveTile: (tiles) => set({ activeTile: tiles }),

    activePools: [],
    setActivePools: (activePools: Pool[]) => set({
        activePools
    })
}));