import { ApiResponse } from "@/types";
import { api } from "@/shared/model/api/instance";
import { useSpatial } from "../model/useSpatial";
import { SpatialResponse } from "../types/spatial";

export const fetchSpatials = async (token: string) => {
  const { setSpatials } = useSpatial.getState();

  await api
    .get<ApiResponse<SpatialResponse[]>>("data/spatial", {
      headers: { Authorization: "Bearer " + token },
    })
    .then(({ data }) => {
      return setSpatials(data.data);
    });
};
