import { Category } from "@/entities/category/types/categories";
import Site from "@/entities/site/types/site";
import { create } from "zustand";

type State = {
    selectedSite: Site | null;
    setSelectedSite: (site: Site | null) => void;

    selectedCategory: Category | null;
    setSelectedCategory: (category: Category | null) => void;
};

export const useMonitorStore = create<State>((set) => ({
    selectedSite: null,
    setSelectedSite: (site) => set({ selectedSite: site }),
    
    selectedCategory: null,
    setSelectedCategory: (category) => set({ selectedCategory: category }),
}));