import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import { create } from "zustand";
import SiteType from "../types/site_type";

type SitesState = {
    siteTypes: SiteType[];
    isLoading: boolean;
    setSiteTypes: (sites: SiteType[]) => void;
    fetchSiteTypes: (token: string) => Promise<void>;
};

export const useSitesTypes = create<SitesState>((set) => ({
    siteTypes: [],
    isLoading: true,

    setSiteTypes: (sites) => set({ siteTypes: sites }),

    fetchSiteTypes: async (token: string) => {
        set({ isLoading: true });

        await api.get<ApiResponse<SiteType[]>>("data/sites/types", {
            headers: { Authorization: "Bearer " + token },
        })
            .then(({ data }) => {
                set({ siteTypes: data.data });
            })
            .finally(() => {
                set({ isLoading: false });
            });
    }
}));
