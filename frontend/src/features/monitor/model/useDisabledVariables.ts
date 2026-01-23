import { create } from 'zustand';

type DisabledState = {
    disabledVariables: number[];
    setDisabledVariables: (disabledVariables: number[]) => void;
    toggleVariable: (id: number) => void;
};

export const useDisabledVariables = create<DisabledState>((set) => ({
    disabledVariables: [],
    setDisabledVariables: (disabledVariables) => set({ disabledVariables }),
    toggleVariable: (id) => set((state) => ({
        disabledVariables: state.disabledVariables.includes(id)
            ? state.disabledVariables.filter(vId => vId !== id)
            : [...state.disabledVariables, id]
    })),
}));
