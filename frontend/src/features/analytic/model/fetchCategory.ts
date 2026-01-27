import { Category } from "@/entities/category/types/categories";
import { useAnalyticSites } from "./useAnalyticSites";
import Site from "@/entities/site/types/site";
import { api } from "@/shared/model/api/instance";
import { GroupedData, PaginatedResult } from "@/shared/model/types/response";
import { ApiResponse } from "@/types";
import useAnalyticStore from "./useAnalyticStore";

export const fetchSite = async (category: Category, site: Site) => {
  const { setSiteLoading, setSiteResult } = useAnalyticSites.getState();
  const { fromDate, toDate } = useAnalyticStore.getState();

  setSiteLoading(category.id, site.id, true);

  const params: Record<string, string> = {};

  if (fromDate) {
    params.minDate = fromDate.toISOString();
  }

  if (toDate) {
    params.maxDate = toDate.toISOString();
  }

  try {
    const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
      `data/category/${category.id}/by-site/${site.code}/paginated-date`,
      { params },
    );

    if (res.status !== 200) {
      return;
    }

    setSiteResult(category.id, site.id, res.data.data);
  } catch (error) {
    console.error(error);
  } finally {
    setSiteLoading(category.id, site.id, false);
  }
};