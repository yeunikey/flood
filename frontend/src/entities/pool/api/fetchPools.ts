import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import Pool from "../types/pool";
import { usePools } from "../model/usePools";

export const fetchPools = async (token: string) => {

    const { setPools } = usePools.getState();

    await api.get<ApiResponse<Pool[]>>('data/pools/', {
        headers: { Authorization: 'Bearer ' + token }
    })
        .then(({ data }) => {
            setPools(data.data);
        })

}