import { create } from "zustand";
import Tile from "../types/tile";

type State = {
    tiles: Tile[];
    setTiles: (tiles: Tile[]) => void;
};

export const useTiles = create<State>((set) => ({
    tiles: [],
    setTiles: (tiles) => set({ tiles }),
}));
