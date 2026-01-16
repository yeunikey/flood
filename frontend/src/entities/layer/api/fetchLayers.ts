import { api } from "@/shared/model/api/instance";
import { useLayers } from "../model/useLayers";
import { ApiResponse } from "@/types";
import Layer from "../types/layer";

export const fetchLayers = async (token: string) => {
  const { setLayers } = useLayers.getState();

  await api
    .get<ApiResponse<Layer[]>>("data/category/sites", {
      headers: { Authorization: "Bearer " + token },
    })
    .then(({ data }) => {
      setLayers(data.data);
    });
};
