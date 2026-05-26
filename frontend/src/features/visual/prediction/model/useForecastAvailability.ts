import { useEffect, useState } from "react";
import { fetchForecastAvailability } from "../api/streamflowForecast";
import { ForecastAvailability } from "./forecast.types";

export function useForecastAvailability() {
  const [availability, setAvailability] = useState<ForecastAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchForecastAvailability();
        if (!cancelled) setAvailability(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { availability, loading, error };
}
