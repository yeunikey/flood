import { Variable } from "@/types";
import { create } from "zustand";

type VariableType = {
    variables: Variable[];
    setVariables: (variables: Variable[]) => void;
};

export const useVariables = create<VariableType>((set) => ({
    variables: [],
    setVariables: (variables) => set({
        variables
    }),
}));