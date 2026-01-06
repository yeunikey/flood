import { api } from "@/shared/model/api/instance";
import { ApiResponse, Variable } from "@/types";
import { create } from "zustand";

type VariableState = {
    variables: Variable[];
    isLoading: boolean;
    setVariables: (variables: Variable[]) => void;
    fetchVariables: (token: string) => Promise<void>;
    addVariable: (variable: Variable) => void;
};

export const useVariables = create<VariableState>((set) => ({
    variables: [],
    isLoading: true,

    setVariables: (variables) => set({ variables }),

    fetchVariables: async (token: string) => {
        set({ isLoading: true });

        await api.get<ApiResponse<Variable[]>>("/variables", {
            headers: { Authorization: "Bearer " + token },
        })
            .then(({ data }) => {
                set({ variables: data.data });
            })
            .finally(() => {
                set({ isLoading: false });
            });
    },

    addVariable: (variable) =>
        set((state) => ({
            variables: [...state.variables, variable],
        })),
}));
