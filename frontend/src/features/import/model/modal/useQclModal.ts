import { create } from 'zustand';

type ModalStore = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export const useQclModal = create<ModalStore>((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
}));
