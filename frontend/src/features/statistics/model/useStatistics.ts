import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { ApiResponse } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataStats,
  HecRasListItem,
  HecRasStats,
  SpatialListItem,
  SpatialStats,
} from "./types";

export function useStatistics() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [spatialStats, setSpatialStats] = useState<SpatialStats | null>(null);
  const [hecRasStats, setHecRasStats] = useState<HecRasStats | null>(null);
  const [spatials, setSpatials] = useState<SpatialListItem[]>([]);
  const [hecRasProjects, setHecRasProjects] = useState<HecRasListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const [dataResult, spatialResult, spatialListResult, hecRasResult, hecRasListResult] =
        await Promise.allSettled([
          api.get<ApiResponse<DataStats>>("data/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<ApiResponse<SpatialStats>>("data/spatial/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<ApiResponse<SpatialListItem[]>>("data/spatial/summary", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<ApiResponse<HecRasStats>>("tiles/hec-ras/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<ApiResponse<HecRasListItem[]>>("tiles/hec-ras", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (dataResult.status === "fulfilled") {
        setStats(dataResult.value.data.data);
      } else {
        throw dataResult.reason;
      }

      if (spatialResult.status === "fulfilled") {
        setSpatialStats(spatialResult.value.data.data);
      } else {
        console.error(spatialResult.reason);
      }

      if (spatialListResult.status === "fulfilled") {
        setSpatials(spatialListResult.value.data.data);
      } else {
        console.error(spatialListResult.reason);
      }

      if (hecRasResult.status === "fulfilled") {
        setHecRasStats(hecRasResult.value.data.data);
      } else {
        console.error(hecRasResult.reason);
      }

      if (hecRasListResult.status === "fulfilled") {
        setHecRasProjects(hecRasListResult.value.data.data);
      } else {
        console.error(hecRasListResult.reason);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const maxValuesCount = useMemo(() => {
    if (!stats?.byCategory.length) return 0;
    return Math.max(...stats.byCategory.map((item) => item.valuesCount));
  }, [stats]);

  const lastDataDate = useMemo(() => {
    const dates =
      stats?.byCategory
        .map((category) => category.lastDate)
        .filter((date): date is string => Boolean(date)) ?? [];

    if (!dates.length) return null;

    return dates.reduce((latest, current) =>
      new Date(current).getTime() > new Date(latest).getTime()
        ? current
        : latest,
    );
  }, [stats]);

  return {
    stats,
    spatialStats,
    hecRasStats,
    spatials,
    hecRasProjects,
    loading,
    error,
    maxValuesCount,
    lastDataDate,
    refresh: fetchStats,
    canRefresh: Boolean(token),
  };
}
