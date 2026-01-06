import { create } from "zustand";
import Qcl from "../types/qcl";

type QclState = {
    qcls: Qcl[];
    setQcls: (variables: Qcl[]) => void;
    
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
};

export const useQcl = create<QclState>((set) => ({
    qcls: [],
    setQcls: (qcls) => set({ qcls: qcls }),

    isLoading: true,
    setLoading: (isLoading) => set({ isLoading }),

}));
