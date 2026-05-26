import { api } from "@/shared/model/api/instance";
import {
  ForecastAvailability,
  ForecastQuery,
  StreamflowForecastRangeResponse,
  StreamflowForecastResponse,
} from "../model/forecast.types";

export const STREAMFLOW_MODEL = {
  model_name: "LSTM_lumped_Uba",
  model_version: "v1.0",
};

export async function fetchForecastAvailability() {
  const { data } = await api.get<ForecastAvailability>(
    "models/streamflow/availability",
    { params: STREAMFLOW_MODEL },
  );
  return data;
}

export async function fetchStreamflowForecast(
  query: ForecastQuery,
): Promise<StreamflowForecastResponse> {
  if (query.dateMode === "single" && query.singleDate) {
    const { data } = await api.post<StreamflowForecastResponse>(
      "models/streamflow/forecast",
      {
        ...STREAMFLOW_MODEL,
        issue_date: query.singleDate,
        device: "cpu",
        write_db: false,
        write_discharge: false,
      },
    );
    return data;
  }

  if (!query.startDate || !query.endDate) {
    throw new Error("Dates are required for a range forecast");
  }

  const { data } = await api.post<StreamflowForecastRangeResponse>(
    "models/streamflow/forecast-range",
    {
      ...STREAMFLOW_MODEL,
      start_date: query.startDate,
      end_date: query.endDate,
      db_variable: query.variable,
      statuses: ["done"],
    },
  );

  return {
    model_name: data.model_name,
    model_version: data.model_version,
    aoi_name: data.aoi_name,
    issue_date: data.start_date,
    forecast: data.series.map(({ date, value }) => ({
      forecast_date: date,
      value,
    })),
  };
}
