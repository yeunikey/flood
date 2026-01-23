import { create } from 'zustand';

type ModalStore = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export const useMethodModal = create<ModalStore>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
