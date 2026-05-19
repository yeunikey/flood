import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { ApiResponse } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataStats } from "./types";

export function useStatistics() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<ApiResponse<DataStats>>("data/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(data.data);
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
    loading,
    error,
    maxValuesCount,
    lastDataDate,
    refresh: fetchStats,
    canRefresh: Boolean(token),
  };
}
