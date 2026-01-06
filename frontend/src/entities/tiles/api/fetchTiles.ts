import { ApiResponse } from "@/types";
import { api } from "@/shared/model/api/instance";
import { useTiles } from "../model/useTiles";
import Tile from "../types/tile";

export const fetchTiles = async (token: string) => {
    const { setTiles } = useTiles.getState();

    await api.get<ApiResponse<Tile[]>>("/tiles", {
        headers: { Authorization: "Bearer " + token },
    })
        .then(({ data }) => {
            return setTiles(data.data);
        });
}