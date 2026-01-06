import { Category } from "@/types";
import { create } from "zustand";

type CategoryType = {
    categories: Category[];
    setCategories: (categories: Category[]) => void;
};

export const useCategories = create<CategoryType>((set) => ({
    categories: [],
    setCategories: (categories) => set({
        categories
    }),
}));