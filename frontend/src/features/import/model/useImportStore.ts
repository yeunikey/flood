import Qcl from '@/entities/qcl/types/qcl';
import Site from '@/entities/site/types/site';
import SiteType from '@/entities/site/types/site_type';
import DataSource from '@/entities/source/types/sources';
import { MethodType } from '@/types';
import { create } from 'zustand';

export interface RawSite {
    code: string;
    latitude: string;
    longitude: string;
    name: string;
}

type ImportStore = {
    stepperLevel: number;
    setStepperLevel: (step: number) => void;

    file: File | null;
    setFile: (file: File | null) => void;

    headers: string[];
    setHeaders: (headers: string[]) => void;

    rows: string[][];
    setRows: (rows: string[][]) => void;

    headerVariableMap: Record<string, number | null>;
    setVariableForHeader: (header: string, variableId: number | null) => void;
    resetHeaderVariableMap: () => void;

    selectedType: SiteType | null;
    setSelectedType: (siteType: SiteType | null) => void;

    selectedQcl: Qcl | null;
    setSelectedQcl: (qclId: Qcl | null) => void;

    selectedSource: DataSource | null;
    setSelectedSource: (sourceId: DataSource | null) => void;

    selectedMethod: MethodType | null;
    setSelectedMethod: (methodId: MethodType | null) => void;

    selectedSite: Site | null;
    setSelectedSite: (site: Site | null) => void;

    sites: RawSite[];               // храним "сырые" точки из csv
    setSites: (sites: RawSite[]) => void;
};

export const useImportStore = create<ImportStore>((set, get) => ({
    stepperLevel: 0,
    setStepperLevel: (step) => set({ stepperLevel: step }),

    file: null,
    setFile: (file) => set({ file }),

    headers: [],
    setHeaders: (headers) => {
        const newMap: Record<string, number | null> = {};
        headers.forEach((h) => (newMap[h] = null));
        set({ headers, headerVariableMap: newMap });
    },

    rows: [],
    setRows: (rows) => set({ rows }),

    headerVariableMap: {},
    setVariableForHeader: (header, variableId) => {
        const map = get().headerVariableMap;
        set({
            headerVariableMap: {
                ...map,
                [header]: variableId,
            },
        });
    },
    resetHeaderVariableMap: () => {
        const headers = get().headers;
        const resetMap: Record<string, number | null> = {};
        headers.forEach((h) => (resetMap[h] = null));
        set({ headerVariableMap: resetMap });
    },

    selectedType: null,
    setSelectedType: (selectedType) => set({ selectedType }),

    selectedQcl: null,
    setSelectedQcl: (qclId) => set({ selectedQcl: qclId }),

    selectedSource: null,
    setSelectedSource: (sourceId) => set({ selectedSource: sourceId }),

    selectedMethod: null,
    setSelectedMethod: (methodId) => set({ selectedMethod: methodId }),

    selectedSite: null,
    setSelectedSite: (site) => set({ selectedSite: site }),

    sites: [],
    setSites: (sites) => set({ sites }),
}));
