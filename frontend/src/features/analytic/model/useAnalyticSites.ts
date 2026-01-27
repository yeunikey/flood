import { create } from "zustand";
import Pool from "@/entities/pool/types/pool";
import Site from "@/entities/site/types/site";
import Layer from "@/entities/layer/types/layer";
import { Category } from "@/entities/category/types/categories";
import { GroupedData, PaginatedResult } from "@/shared/model/types/response";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import Variable from "@/entities/variable/types/variable";

export type AnalyticSite = Site & {
  result: PaginatedResult<GroupedData> | null;
  loading: boolean;

  chartResult: GroupedData[] | null;
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
    result: PaginatedResult<GroupedData>,
  ) => void;
  setSiteLoading: (
    categoryId: number,
    siteId: number,
    loading: boolean,
  ) => void;

  setSiteChartResult: (
    categoryId: number,
    siteId: number,
    result: GroupedData[],
  ) => void;
  setSiteChartLoading: (
    categoryId: number,
    siteId: number,
    loading: boolean,
  ) => void;

  setActivePools: (activePools: Pool[]) => void;
  togglePool: (pool: Pool) => void;
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
              chartLoading: false,
              category,
              page: 0,
              rowsPerPage: 10,
            },
          ];

      if (newSites.length === 0) {
        const newActiveSites = { ...state.activeSites };
        delete newActiveSites[categoryId];
        return { activeSites: newActiveSites };
      }

      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: {
            category,
            variables: currentRecord?.variables ?? [],
            sites: newSites,
          },
        },
      };
    }),

  setAllSites: (sites) => set({ activeSites: sites }),

  selectAll: (pools, layers) =>
    set(() => {
      const newActiveSites: Record<number, SiteRecord> = {};
      const addedKeys = new Set<string>();

      const add = (category: Category, sites: Site[]) => {
        if (!newActiveSites[category.id]) {
          newActiveSites[category.id] = {
            category,
            variables: [],
            sites: [],
          };
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

      return { activeSites: newActiveSites };
    }),

  clearSites: () => set({ activeSites: {} }),

  setVariables: (categoryId, variables) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: {
            ...record,
            variables,
          },
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

      let min: Date | null = null;
      let max: Date | null = null;

      Object.values(newActiveSites).forEach((rec) => {
        rec.sites.forEach((site) => {
          if (site.result) {
            const siteMin = site.result.minDate
              ? new Date(site.result.minDate)
              : null;
            const siteMax = site.result.maxDate
              ? new Date(site.result.maxDate)
              : null;

            if (siteMin && (!min || siteMin < min)) {
              min = siteMin;
            }
            if (siteMax && (!max || siteMax > max)) {
              max = siteMax;
            }
          }
        });
      });

      useAnalyticStore.getState().setGlobalRange(min, max);

      return {
        activeSites: newActiveSites,
      };
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

  setSiteChartResult: (categoryId, siteId, result) =>
    set((state) => {
      const record = state.activeSites[categoryId];
      if (!record) return state;

      const updatedSites = record.sites.map((s) =>
        s.id === siteId ? { ...s, chartResult: result } : s,
      );

      return {
        activeSites: {
          ...state.activeSites,
          [categoryId]: { ...record, sites: updatedSites },
        },
      };
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
