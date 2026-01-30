import Pool from '@/entities/pool/types/pool';
import { create } from 'zustand';

type Store = {
    createPoolModal: boolean;
    setCreatePoolModal: (createPoolModal: boolean) => void;

    updatePoolModal: boolean;
    setUpdatePoolModal: (updatePoolModal: boolean) => void;

    editingPool: Pool | null;
    setEditingPool: (editingPool: Pool | null) => void;
};

export const usePoolStore = create<Store>((set) => ({

    createPoolModal: false,
    setCreatePoolModal: (createPoolModal: boolean) => set({
        createPoolModal
    }),

    updatePoolModal: false,
    setUpdatePoolModal: (updatePoolModal: boolean) => set({
        updatePoolModal
    }),

    editingPool: null,
    setEditingPool: (editingPool: Pool | null) => set({
        editingPool
    })
}));
