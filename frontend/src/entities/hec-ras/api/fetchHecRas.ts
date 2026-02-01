import { api } from "@/shared/model/api/instance";
import { useHecRas } from "../model/useHecRas";
import { ApiResponse } from "@/types";
import HecRas from "../types/hec-ras";

export const fetchHecRas = async (token: string) => {
  const { setHecRas } = useHecRas.getState();

  await api
    .get<ApiResponse<HecRas[]>>("tiles/hec-ras", {
      headers: { Authorization: "Bearer " + token },
    })
    .then(({ data }) => {
      setHecRas(data.data);
    });
};
