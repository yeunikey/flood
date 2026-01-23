
import { Category } from '@/entities/category/types/categories';
import { create } from 'zustand';

type SelectionState = {
    selectedCategory: Category | undefined;
    setSelectedCategory: (category: Category | undefined) => void;
};

export const useCategorySelection = create<SelectionState>((set) => ({
    selectedCategory: undefined,
    setSelectedCategory: (category: Category | undefined) => set({
        selectedCategory: category
    }),
}));
