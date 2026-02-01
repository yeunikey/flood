import { Category } from "@/entities/category/types/categories";
import { AnalyticSite, useAnalyticSites } from "./useAnalyticSites";
import Site from "@/entities/site/types/site";
import { api } from "@/shared/model/api/instance";
import { GroupedData, PaginatedResult } from "@/shared/model/types/response";
import { ApiResponse } from "@/types";
import useAnalyticStore from "./useAnalyticStore";
import Variable from "@/entities/variable/types/variable";

export const fetchSite = async (category: Category, site: Site) => {
  const { setSiteLoading, setSiteResult, setVariables, activeSites } =
    useAnalyticSites.getState();
  const { fromDate, toDate } = useAnalyticStore.getState();

  setSiteLoading(category.id, site.id, true);

  const params: Record<string, string> = {};

  if (fromDate) params.minDate = fromDate.toISOString();
  if (toDate) params.maxDate = toDate.toISOString();

  const categoryRecord = activeSites[category.id];

  if (categoryRecord && categoryRecord.variables.length === 0) {
    try {
      const res = await api.get<ApiResponse<{ variables: Variable[] }>>(
        `/data/category/${category.id}/variables`,
        { params: { siteCode: site.code } },
      );

      if (res.status === 200) {
        setVariables(category.id, res.data.data.variables);
      }
    } catch (error) {
      console.error(error);
    }
  }

  try {
    const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
      `data/category/${category.id}/by-site/${site.code}/paginated-date`,
      { params },
    );

    if (res.status === 200) {
      setSiteResult(category.id, site.id, res.data.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setSiteLoading(category.id, site.id, false);
  }
};

export const fetchAnalyticData = async (
  token: string,
  site: AnalyticSite,
  page: number,
  rowsPerPage: number,
  start: Date | null,
  end: Date | null,
  sourceId?: number,
) => {
  const { setSiteLoading, setSiteResult, setVariables, activeSites } =
    useAnalyticSites.getState();

  const category = site.category;

  setSiteLoading(category.id, site.id, true);

  const params: Record<string, string> = {
    page: page.toString(),
    limit: rowsPerPage.toString(),
  };

  if (start) params.start = start.toISOString();
  if (end) params.end = end.toISOString();
  if (sourceId) params.sourceId = sourceId.toString();

  const categoryRecord = activeSites[category.id];

  if (categoryRecord && categoryRecord.variables.length === 0) {
    try {
      const res = await api.get<ApiResponse<{ variables: Variable[] }>>(
        `/data/category/${category.id}/variables`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { siteCode: site.code, sourceId },
        },
      );

      if (res.status === 200) {
        setVariables(category.id, res.data.data.variables);
      }
    } catch (error) {
      console.error(error);
    }
  }

  try {
    const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
      `data/category/${category.id}/by-site/${site.code}/paginated-date`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.status === 200) {
      setSiteResult(category.id, site.id, res.data.data);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setSiteLoading(category.id, site.id, false);
  }
};

export const fetchChartData = async (
  token: string,
  site: AnalyticSite,
  fromDate: Date | null,
  toDate: Date | null,
  sourceId?: number,
) => {
  const { setSiteChartLoading, setSiteChartResult } =
    useAnalyticSites.getState();

  const {
    toDate: storeToDate,
    setToDate,
  } = useAnalyticStore.getState();

  const category = site.category;

  setSiteChartLoading(category.id, site.id, true);

  const params: Record<string, string> = {};

  if (fromDate) params.start = fromDate.toISOString();
  if (toDate) params.end = toDate.toISOString();
  if (sourceId) params.sourceId = sourceId.toString();

  try {
    const res = await api.get<
      ApiResponse<{
        start: Date;
        end: Date;
        minDate: Date;
        maxDate: Date;
        total: number;
        content: GroupedData[];
      }>
    >(`/data/category/${category.id}/by-site/${site.code}/by-date`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    if (res.status === 200 && res.data.data) {
      setSiteChartResult(category.id, site.id, res.data.data.content);

      if (storeToDate === null && res.data.data.maxDate) {
        setToDate(new Date(res.data.data.maxDate));
      }
    }
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
  } finally {
    setSiteChartLoading(category.id, site.id, false);
  }
};