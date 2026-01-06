
import { create } from "zustand";
import Pool from "../types/pool";

type State = {
    pools: Pool[];
    setPools: (pools: Pool[]) => void;
};

export const usePools = create<State>((set) => ({
    pools: [],
    setPools: (pools) => set({ pools }),
}));
