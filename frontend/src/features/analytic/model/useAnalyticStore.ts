import Variable from "@/entities/variable/types/variable";
import { GroupedData } from "@/types";
import { create } from "zustand";

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
  disabledVariables: Record<number, number[]>;

  setVariableCollapse: (value: boolean) => void;
  setFromDate: (date: Date | null) => void;
  setToDate: (date: Date | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowDependencies: (value: boolean) => void;
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  setGlobalRange: (min: Date | null, max: Date | null) => void;
}

const useAnalyticStore = create<AnalyticState>((set) => ({
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
}));

export default useAnalyticStore;
