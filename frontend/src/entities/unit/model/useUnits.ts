import { create } from "zustand";
import Unit from "../types/unit";
import { ApiResponse } from "@/types";
import { api } from "@/shared/model/api/instance";

type UnitState = {
    isLoading: boolean;
    
    units: Unit[];
    setUnits: (units: Unit[]) => void;
    addUnit: (unit: Unit) => void;
    
    fetchUnits: (token: string) => void;
};

export const useUnits = create<UnitState>((set) => ({
    units: [],
    isLoading: true,

    setUnits: (units) => set({ units }),

    fetchUnits: async (token: string) => {
        set({ isLoading: true });

        await api
            .get<ApiResponse<Unit[]>>("/variables/units", {
                headers: { Authorization: "Bearer " + token },
            })
            .then(({ data }) => {
                set({ units: data.data });
            })
            .finally(() => {
                set({ isLoading: false });
            });
    },

    addUnit: (unit) =>
        set((state) => ({
            units: [...state.units, unit],
        })),
}));
