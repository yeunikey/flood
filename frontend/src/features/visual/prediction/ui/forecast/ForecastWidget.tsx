import { useMemo } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { formatDate, mapForecastData } from "../../model/forecast.utils";
import { usePredictionSites } from "../../model/usePredictionSites";
import { useStreamflowForecast } from "../../model/useStreamflowForecast";
import ForecastChart from "./ForecastChart";
import ForecastPlaceholder from "./ForecastPlaceholder";
import ForecastSummary from "./ForecastSummary";
import ForecastTable from "./ForecastTable";

export default function ForecastWidget() {
  const activeSite = usePredictionSites((state) => state.activeSite);
  const query = usePredictionSites((state) => state.forecastQuery);
  const { forecast, loading, error } = useStreamflowForecast();
  const data = useMemo(
    () => mapForecastData(forecast?.forecast ?? []),
    [forecast],
  );

  if (!activeSite) {
    return (
      <ForecastPlaceholder
        title="Выберите точку"
        description="Укажите гидропост в списке слева, чтобы построить прогноз."
      />
    );
  }

  if (!query) {
    return (
      <ForecastPlaceholder
        title="Выберите даты для forecast"
        description="Укажите доступную дату или период и нажмите «Построить прогноз»."
      />
    );
  }

  if (loading) {
    return (
      <Box
        minHeight={360}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Загрузка прогноза...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Не удалось загрузить прогноз для выбранной даты.
        </Alert>
      </Box>
    );
  }

  return (
    <div className="p-6 pb-16">
      <Box sx={{ width: "100%" }}>
        <Box className="flex flex-col gap-3 sm:gap-4">
          <ForecastChart
            data={data}
            issueDate={forecast ? formatDate(forecast.issue_date) : "-"}
            aoiName={forecast?.aoi_name || "-"}
            isRange={query?.dateMode === "range"}
          />
          <Box display="flex" flexDirection="column" gap={{ xs: 2, sm: 3 }}>
            <ForecastSummary data={data} />
            <ForecastTable data={data} />
          </Box>
        </Box>
      </Box>
    </div>
  );
}
