import { create } from "zustand";
import Pool from "@/entities/pool/types/pool";
import Site from "@/entities/site/types/site";
import Layer from "@/entities/layer/types/layer";
import { Category } from "@/entities/category/types/categories";
import { PaginatedResult } from "@/shared/model/types/response";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import Variable from "@/entities/variable/types/variable";

export interface FormattedGroup {
  id: number;
  date_utc: string;
  category: number;
  site_code: string;
  method: {
    name: string;
    description: string;
  };
  source: {
    name: string;
  };
  qcl: {
    name: string;
    description: string;
  };
  variables: number[];
  values: string[];
}

export type AnalyticSite = Site & {
  result: PaginatedResult<FormattedGroup> | null;
  loading: boolean;
  chartResult: FormattedGroup[] | null;
  chartAllDates?: { minDate: string; maxDate: string } | null;
  chartLoading: boolean;
  category: Category;
  page: number;
  rowsPerPage: number;
};

export type SiteRecord = {
  category: Category;
  variables: Variable[];
  sites: AnalyticSite[];
};

type State = {
  activeSites: Record<number, SiteRecord>;
  activePools: Pool[];
  toggleSite: (category: Category, site: Site) => void;
  setAllSites: (sites: Record<number, SiteRecord>) => void;
  selectAll: (pools: Pool[], layers: Layer[]) => void;
  clearSites: () => void;
  setVariables: (categoryId: number, variables: Variable[]) => void;
  setSitePage: (categoryId: number, siteId: number, page: number) => void;
  setSiteRowsPerPage: (
    categoryId: number,
    siteId: number,
    rows: number,
  ) => void;
  setSiteResult: (
    categoryId: number,
    siteId: number,
    result: PaginatedResult<FormattedGroup>,
  ) => void;
  setSiteLoading: (
    categoryId: number,
    siteId: number,
    loading: boolean,
  ) => void;
  setSiteChartResult: (
    categoryId: number,
    siteId: number,
    result: FormattedGroup[],
    allDates?: { minDate: string; maxDate: string },
  ) => void;
  setSiteChartLoading: (
    categoryId: number,
    siteId: number,
    loading: boolean,
  ) => void;
  setActivePools: (activePools: Pool[]) => void;
  togglePool: (pool: Pool) => void;
};

const updateGlobalRange = (activeSites: Record<number, SiteRecord>) => {
  let min: Date | null = null;
  let max: Date | null = null;

  Object.values(activeSites).forEach((rec) => {
    rec.sites.forEach((site) => {
      const checkAndSet = (
        minVal?: string | Date | null,
        maxVal?: string | Date | null,
      ) => {
        if (minVal) {
          const dMin = new Date(minVal);
          if (!isNaN(dMin.getTime()) && (!min || dMin < min)) min = dMin;
        }
        if (maxVal) {
          const dMax = new Date(maxVal);
          if (!isNaN(dMax.getTime()) && (!max || dMax > max)) max = dMax;
        }
      };

      if (site.result) {
        checkAndSet(site.result.minDate, site.result.maxDate);
      }
      if (site.chartAllDates) {
        checkAndSet(site.chartAllDates.minDate, site.chartAllDates.maxDate);
      }
    });
  });

  useAnalyticStore.getState().setGlobalRange(min, max);
};

export const useAnalyticSites = create<State>((set) => ({
  activeSites: {},
  activePools: [],

  toggleSite: (category, site) =>
    set((state) => {
      const categoryId = category.id;
      const currentRecord = state.activeSites[categoryId];
      const currentSites = currentRecord?.sites || [];
      const exists = currentSites.some((s) => s.id === site.id);

      const newSites = exists
        ? currentSites.filter((s) => s.id !== site.id)
        : [
            ...currentSites,
            {
              ...site,
              result: null,
              loading: false,
              chartResult: null,
              chartAllDates: null,
              chartLoading: false,
              category,
              page: 0,
              rowsPerPage: 10,
            },
          ];

      if (newSites.length === 0) {
        const newActiveSites = { ...state.activeSites };
        delete newActiveSites[categoryId];
        updateGlobalRange(newActiveSites);
        return { activeSites: newActiveSites };
      }

      const newActiveSites = {
        ...state.activeSites,
        [categoryId]: {
          category,
          variables: currentRecord?.variables ?? [],
          sites: newSites as AnalyticSite[],
        },
      };
      updateGlobalRange(newActiveSites);
      return { activeSites: newActiveSites };
    }),

  setAllSites: (sites) => {
    updateGlobalRange(sites);
    set({ activeSites: sites });
  },

  selectAll: (pools, layers) =>
    set(() => {
      const newActiveSites: Record<number, SiteRecord> = {};
      const addedKeys = new Set<string>();

      const add = (category: Category, sites: Site[]) => {
        if (!newActiveSites[category.id]) {
          newActiveSites[category.id] = { category, variables: [], sites: [] };
        }

        sites.forEach((site) => {
          const key = `${category.id}-${site.id}`;
          if (!addedKeys.has(key)) {
            addedKeys.add(key);
            newActiveSites[category.id].sites.push({
              ...site,
              result: null,
              loading: false,
              chartResult: null,
              chartAllDates: null,
              chartLoading: false,
              category,
              page: 0,
              rowsPerPage: 10,
            });
          }
        });
      };

      pools.forEach((p) => {
        layers.forEach((l) => {
          const sitesInLayer = l.sites.filter((s) =>
            p.sites.some((ps) => ps.id === s.id),
          );
          if (sitesInLayer.length) add(l.category, sitesInLayer);
        });
      });

      layers.forEach((l) => {
        const standalones = l.sites.filter(
          (s) => !pools.some((p) => p.sites.some((ps) => ps.id === s.id)),
        );
        if (standalones.length) add(l.category, standalones);
      });

      updateGlobalRange(newActiveSites);
      return { activeSites: newActiveSites };
    }),

  clearSites: () => {
    useAnalyticStore.getState().setGlobalRange(null, null);
    set({ activeSites: {} });
  },

  setVariables: (categoryId, variables) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, variables },
        },
      };
    }),

  setSitePage: (categoryId, siteId, page) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, page } : s,
      );
      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, sites: updatedSites },
        },
      };
    }),

  setSiteRowsPerPage: (categoryId, siteId, rowsPerPage) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, rowsPerPage, page: 0 } : s,
      );
      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, sites: updatedSites },
        },
      };
    }),

  setSiteResult: (categoryId, siteId, result) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, result } : s,
      );
      const newActiveSites = {
        ...state.activeSites,
        [categoryId]: { ...record, sites: updatedSites },
      };

      updateGlobalRange(newActiveSites);
      return { activeSites: newActiveSites };
    }),

  setSiteLoading: (categoryId, siteId, loading) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, loading } : s,
      );
      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, sites: updatedSites },
        },
      };
    }),

  setSiteChartResult: (categoryId, siteId, result, allDates) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId
          ? { ...s, chartResult: result, chartAllDates: allDates || null }
          : s,
      );

      const newActiveSites = {
        ...state.activeSites,
        [categoryId]: { ...record, sites: updatedSites },
      };

      updateGlobalRange(newActiveSites);
      return { activeSites: newActiveSites };
    }),

  setSiteChartLoading: (categoryId, siteId, loading) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, chartLoading: loading } : s,
      );
      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, sites: updatedSites },
        },
      };
    }),

  setActivePools: (activePools) => set({ activePools }),

  togglePool: (pool) =>
    set((state) => {
      const exists = state.activePools.some((p) => p.id === pool.id);
      return {
        activePools: exists
          ? state.activePools.filter((p) => p.id !== pool.id)
          : [...state.activePools, pool],
      };
    }),
}));
