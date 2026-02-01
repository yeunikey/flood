import { Category } from "@/entities/category/types/categories";
import Site from "@/entities/site/types/site";
import DataSource from "@/entities/source/types/sources";
import { create } from "zustand";

type State = {
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;

  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;

  selectedSource: DataSource | null;
  setSelectedSource: (source: DataSource | null) => void;
};

export const useMonitorStore = create<State>((set) => ({
  selectedSite: null,
  setSelectedSite: (site) => set({ selectedSite: site }),

  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  selectedSource: null,
  setSelectedSource: (source) => set({ selectedSource: source }),
}));
