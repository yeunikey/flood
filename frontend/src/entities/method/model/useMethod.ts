import { MethodType } from "@/types";
import { create } from "zustand";

type MethodState = {
    methods: MethodType[];
    setMethods: (methods: MethodType[]) => void;
    
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
};

export const useMethods = create<MethodState>((set) => ({
    methods: [],
    setMethods: (qcls) => set({ methods: qcls }),

    isLoading: true,
    setLoading: (isLoading) => set({ isLoading }),

}));
