import { ForecastDataPoint, StreamflowForecastPoint } from "./forecast.types";

export const formatApiDate = (date: Date | null) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseApiDate = (date: string | null) => {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

export const mapForecastData = (
  forecast: StreamflowForecastPoint[],
): ForecastDataPoint[] =>
  forecast.map((point) => ({
    date: formatDate(point.forecast_date),
    displayDate: new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(point.forecast_date)),
    predicted: point.value,
    observed: null,
  }));
