import { ApiResponse } from "@/types";
import Site from "../types/site";
import { api } from "@/shared/model/api/instance";
import { useSites } from "../model/useSites";

export const fetchSites = async (token: string) => {
    const { setSites } = useSites.getState();

    await api.get<ApiResponse<Site[]>>("/sites", {
        headers: { Authorization: "Bearer " + token },
    })
        .then(({ data }) => {
            return setSites(data.data);
        });
}