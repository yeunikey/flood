import { Category } from "../types/categories";

import { create } from 'zustand';

type CategoryState = {
    categories: Category[];
    setCategories: (categories: Category[]) => void;

    isLoading: boolean;
    setLoading: (loading: boolean) => void;
};

export const useCategories = create<CategoryState>((set) => ({
    categories: [],

    setCategories: (categories: Category[]) => set({
        categories: categories
    }),

    isLoading: true,
    setLoading: (isLoading: boolean) => set({
        isLoading
    })
}));
