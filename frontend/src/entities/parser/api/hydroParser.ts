import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import {
  HydroImportAllResult,
  HydroImportResult,
  HydroParserSite,
} from "../types/hydroParser";

export const fetchHydroParserSites = async (token: string) => {
  const { data } = await api.get<ApiResponse<HydroParserSite[]>>(
    "parser/hydro/sites",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data.data;
};

export const importHydroParserSite = async (
  token: string,
  siteCode: string,
  payload: { startDate?: string; endDate?: string },
) => {
  const { data } = await api.post<ApiResponse<HydroImportResult>>(
    `parser/hydro/sites/${siteCode}/import`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data.data;
};

export const importAllHydroParserSites = async (token: string) => {
  const { data } = await api.post<ApiResponse<HydroImportAllResult>>(
    "parser/hydro/import-all",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data.data;
};
