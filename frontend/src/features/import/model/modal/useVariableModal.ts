import { create } from 'zustand';

type ModalStore = {
    open: boolean;
    setOpen: (open: boolean) => void;

    headerIndex: number;
    setHeaderIndex: (index: number) => void
};

export const useVariableModal = create<ModalStore>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),

    headerIndex: -1,
    setHeaderIndex: (index: number) => set({
        headerIndex: index
    })
}));
