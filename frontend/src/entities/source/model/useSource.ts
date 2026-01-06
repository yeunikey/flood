import { create } from "zustand";
import DataSource from "../types/sources";

type SourceState = {
    sources: DataSource[];
    setSources: (sources: DataSource[]) => void;

    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
};

export const useSources = create<SourceState>((set) => ({
    sources: [],
    setSources: (qcls) => set({ sources: qcls }),

    isLoading: true,
    setLoading: (isLoading) => set({ isLoading }),
}));
