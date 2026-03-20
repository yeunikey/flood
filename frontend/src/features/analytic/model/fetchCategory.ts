import { Category } from "@/entities/category/types/categories";
import {
  AnalyticSite,
  FormattedGroup,
  useAnalyticSites,
} from "./useAnalyticSites";
import Site from "@/entities/site/types/site";
import { api } from "@/shared/model/api/instance";
import { PaginatedResult } from "@/shared/model/types/response";
import { ApiResponse } from "@/types";
import useAnalyticStore from "./useAnalyticStore";
import Variable from "@/entities/variable/types/variable";
import { decodeGetResponse, decodePaginatedResponse } from "./data.pb";

export const fetchSite = async (category: Category, site: Site) => {
  const { setSiteLoading, setSiteResult, setVariables, activeSites } =
    useAnalyticSites.getState();
  const { fromDate, toDate } = useAnalyticStore.getState();

  setSiteLoading(category.id, site.id, true);

  const params: Record<string, string> = {};

  if (fromDate) params.start = fromDate.toISOString();
  if (toDate) params.end = toDate.toISOString();

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
    const res = await api.get(
      `data/category/${category.id}/by-site/${site.code}/paginated-date`,
      { 
        params,
        responseType: "arraybuffer",
      },
    );

    const decoded = decodePaginatedResponse(
      new Uint8Array(res.data),
    ) as unknown as PaginatedResult<FormattedGroup>;

    setSiteResult(category.id, site.id, decoded);
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
  limit: number,
  start: Date | null,
  end: Date | null,
  sourceId?: number,
) => {
  const { setSiteLoading, setSiteResult } = useAnalyticSites.getState();
  setSiteLoading(site.category.id, site.id, true);

  try {
    const response = await api.get(
      `/data/category/${site.category.id}/by-site/${site.code}/paginated-date`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit,
          ...(start && { start: start.toISOString() }),
          ...(end && { end: end.toISOString() }),
          ...(sourceId && { sourceId }),
        },
        responseType: "arraybuffer",
      },
    );

    const decoded = decodePaginatedResponse(
      new Uint8Array(response.data),
    ) as unknown as PaginatedResult<FormattedGroup>;

    console.log(decoded)

    setSiteResult(site.category.id, site.id, decoded);
  } catch (error) {
    console.error(error);
  } finally {
    setSiteLoading(site.category.id, site.id, false);
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

  const { toDate: storeToDate, setToDate } = useAnalyticStore.getState();

  const category = site.category;

  setSiteChartLoading(category.id, site.id, true);

  const params: Record<string, string> = {};

  if (fromDate) params.start = fromDate.toISOString();
  if (toDate) params.end = toDate.toISOString();
  if (sourceId) params.sourceId = sourceId.toString();

  try {
    const res = await api.get(
      `/data/category/${category.id}/by-site/${site.code}/by-date`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: "arraybuffer",
      },
    );

    if (res.status === 200 && res.data) {
      const decoded = decodeGetResponse(
        new Uint8Array(res.data as ArrayBuffer),
      );

      setSiteChartResult(
        category.id,
        site.id,
        decoded.groups as unknown as FormattedGroup[],
      );

      console.log({
        ...decoded,
        groups: null,
      });

      if (storeToDate === null && decoded.allDates?.maxDate) {
        setToDate(new Date(decoded.allDates.maxDate));
      }
    } else {
      setSiteChartResult(category.id, site.id, []);
    }
  } catch (error) {
    console.error("Ошибка при декодировании protobuf:", error);
    setSiteChartResult(category.id, site.id, []);
  } finally {
    setSiteChartLoading(category.id, site.id, false);
  }
};
