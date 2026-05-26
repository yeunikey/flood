import { useEffect, useState } from "react";
import { fetchStreamflowForecast } from "../api/streamflowForecast";
import { StreamflowForecastResponse } from "./forecast.types";
import { usePredictionSites } from "./usePredictionSites";

type ForecastResult = {
  key: string;
  data: StreamflowForecastResponse | null;
  error: boolean;
};

export function useStreamflowForecast() {
  const activeSite = usePredictionSites((state) => state.activeSite);
  const forecastQuery = usePredictionSites((state) => state.forecastQuery);
  const requestKey =
    activeSite && forecastQuery
      ? `${activeSite.id}:${JSON.stringify(forecastQuery)}`
      : null;
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!forecastQuery || !requestKey) return;

    let cancelled = false;
    const load = async () => {
      setLoadingKey(requestKey);
      try {
        const data = await fetchStreamflowForecast(forecastQuery);
        if (!cancelled) setResult({ key: requestKey, data, error: false });
      } catch {
        if (!cancelled) setResult({ key: requestKey, data: null, error: true });
      } finally {
        if (!cancelled) setLoadingKey(null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [forecastQuery, requestKey]);

  const currentResult = result?.key === requestKey ? result : null;
  return {
    forecast: currentResult?.data ?? null,
    loading: loadingKey === requestKey,
    error: currentResult?.error ?? false,
  };
}
