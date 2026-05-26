export type DateMode = "single" | "range";

export type ForecastQuery = {
  dateMode: DateMode;
  singleDate: string | null;
  startDate: string | null;
  endDate: string | null;
  variable: "streamflow";
};

export interface ForecastAvailability {
  model_name: string;
  model_version: string;
  aoi_name: string;
  dates: string[];
  months: string[];
  start_date: string | null;
  end_date: string | null;
}

export interface StreamflowForecastPoint {
  forecast_date: string;
  value: number;
}

export interface StreamflowForecastResponse {
  model_name: string;
  model_version: string;
  aoi_name: string;
  issue_date: string;
  forecast: StreamflowForecastPoint[];
}

export interface StreamflowForecastRangeResponse {
  model_name: string;
  model_version: string;
  aoi_name: string;
  start_date: string;
  end_date: string;
  series: { date: string; value: number }[];
}

export interface ForecastDataPoint {
  date: string;
  displayDate: string;
  predicted: number;
  observed: number | null;
  [key: string]: string | number | null;
}
