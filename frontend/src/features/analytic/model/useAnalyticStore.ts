import { create } from "zustand";
import { GroupedData } from "@/types";
import Variable from "@/entities/variable/types/variable";

type ViewMode = "table" | "chart";

interface AnalyticState {
  variableCollapse: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  viewMode: ViewMode;
  showDependencies: boolean;
  page: number;
  rowsPerPage: number;
  globalMinDate: Date | null;
  globalMaxDate: Date | null;

  variables: Record<string, Variable[]>;
  infoValues: Record<string, GroupedData[]>;

  // Key: `${categoryId}-${siteId}`, Value: array of disabled variable IDs
  disabledVariables: Record<string, number[]>;

  setVariableCollapse: (value: boolean) => void;
  setFromDate: (date: Date | null) => void;
  setToDate: (date: Date | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowDependencies: (value: boolean) => void;
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  setGlobalRange: (min: Date | null, max: Date | null) => void;

  toggleDisabledVariable: (
    categoryId: number,
    siteId: number,
    variableId: number,
  ) => void;
  
  // Новый метод для массового обновления
  setDisabledVariables: (
    categoryId: number,
    siteId: number,
    variableIds: number[],
  ) => void;

  isVariableDisabled: (
    categoryId: number,
    siteId: number,
    variableId: number,
  ) => boolean;
}

const useAnalyticStore = create<AnalyticState>((set, get) => ({
  variableCollapse: false,
  fromDate: null,
  toDate: null,
  viewMode: "table",
  showDependencies: false,
  page: 0,
  rowsPerPage: 10,
  globalMinDate: null,
  globalMaxDate: null,
  variables: {},
  infoValues: {},
  disabledVariables: {},

  setVariableCollapse: (variableCollapse) => set({ variableCollapse }),
  setFromDate: (fromDate) => set({ fromDate, page: 0 }),
  setToDate: (toDate) => set({ toDate, page: 0 }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowDependencies: (showDependencies) => set({ showDependencies }),
  setPage: (page) => set({ page }),
  setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),
  setGlobalRange: (globalMinDate, globalMaxDate) =>
    set({ globalMinDate, globalMaxDate }),

  toggleDisabledVariable: (categoryId, siteId, variableId) =>
    set((state) => {
      const key = `${categoryId}-${siteId}`;
      const currentList = state.disabledVariables[key] || [];
      const exists = currentList.includes(variableId);

      const newList = exists
        ? currentList.filter((id) => id !== variableId)
        : [...currentList, variableId];

      return {
        disabledVariables: {
          ...state.disabledVariables,
          [key]: newList,
        },
      };
    }),

  setDisabledVariables: (categoryId, siteId, variableIds) =>
    set((state) => ({
      disabledVariables: {
        ...state.disabledVariables,
        [`${categoryId}-${siteId}`]: variableIds,
      },
    })),

  isVariableDisabled: (categoryId, siteId, variableId) => {
    const key = `${categoryId}-${siteId}`;
    const list = get().disabledVariables[key];
    return list ? list.includes(variableId) : false;
  },
}));

export default useAnalyticStore;