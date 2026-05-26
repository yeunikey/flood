import { useMemo, useState } from "react";
import { ShowChart } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateMode } from "../model/forecast.types";
import { formatApiDate, parseApiDate } from "../model/forecast.utils";
import { useForecastAvailability } from "../model/useForecastAvailability";
import { usePredictionSites } from "../model/usePredictionSites";

function PredictionTools() {
  const activeSite = usePredictionSites((state) => state.activeSite);
  const setForecastQuery = usePredictionSites(
    (state) => state.setForecastQuery,
  );
  const { availability, loading, error } = useForecastAvailability();
  const [variable, setVariable] = useState("streamflow");
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const availableDates = useMemo(
    () => new Set(availability?.dates ?? []),
    [availability],
  );
  const availableMonths = useMemo(
    () => new Set(availability?.months ?? []),
    [availability],
  );

  const isAvailableDate = (date: Date | null) => {
    const key = formatApiDate(date);
    return key !== null && availableDates.has(key);
  };

  const shouldDisableDate = (date: Date) => !isAvailableDate(date);
  const shouldDisableMonth = (date: Date) => {
    const key = formatApiDate(date)?.slice(0, 7);
    return !key || !availableMonths.has(key);
  };

  const validDates =
    dateMode === "single"
      ? isAvailableDate(singleDate)
      : isAvailableDate(startDate) &&
        isAvailableDate(endDate) &&
        startDate !== null &&
        endDate !== null &&
        startDate <= endDate;

  const applyForecastQuery = () => {
    if (!validDates || variable !== "streamflow") return;
    setForecastQuery({
      dateMode,
      singleDate: formatApiDate(singleDate),
      startDate: formatApiDate(startDate),
      endDate: formatApiDate(endDate),
      variable: "streamflow",
    });
  };

  const pickerProps = {
    minDate: parseApiDate(availability?.start_date ?? null),
    maxDate: parseApiDate(availability?.end_date ?? null),
    shouldDisableDate,
    shouldDisableMonth,
    disabled: !activeSite || loading || error || !availability,
    loading: Boolean(activeSite) && loading,
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-3 lg:justify-between">
        <div className="flex min-w-max flex-nowrap items-center gap-3 lg:gap-6">
          <FormControl
            size="small"
            sx={{ width: { xs: 172, lg: 192 }, flexShrink: 0 }}
          >
            <InputLabel id="variable-select-label">Переменная</InputLabel>
            <Select
              labelId="variable-select-label"
              value={variable}
              label="Переменная"
              onChange={(event: SelectChangeEvent) =>
                setVariable(event.target.value)
              }
            >
              <MenuItem value="streamflow">Расход воды, м³/с</MenuItem>
            </Select>
          </FormControl>

          <Divider
            orientation="vertical"
            flexItem
            className="hidden md:block"
          />

          <div className="flex flex-nowrap items-center gap-3 sm:gap-4">
            <ToggleButtonGroup
              color="primary"
              value={dateMode}
              exclusive
              onChange={(_, nextMode: DateMode | null) =>
                nextMode && setDateMode(nextMode)
              }
              disabled={!activeSite}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="single" className="px-4!">
                День
              </ToggleButton>
              <ToggleButton value="range" className="px-4!">
                Период
              </ToggleButton>
            </ToggleButtonGroup>

            {dateMode === "single" ? (
              <DatePicker
                {...pickerProps}
                label="Дата"
                value={singleDate}
                onChange={setSingleDate}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                  },
                }}
              />
            ) : (
              <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                <DatePicker
                  {...pickerProps}
                  label="С"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                    },
                  }}
                />
                <Typography sx={{ flexShrink: 0 }}>-</Typography>
                <DatePicker
                  {...pickerProps}
                  label="По"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                    },
                  }}
                />
              </Box>
            )}
          </div>
          {error && (
            <Typography color="error" variant="caption">
              Не удалось загрузить доступные даты
            </Typography>
          )}
        </div>

        <Button
          variant="contained"
          startIcon={<ShowChart />}
          disabled={!activeSite || !validDates || variable !== "streamflow"}
          onClick={applyForecastQuery}
          disableElevation
          color="primary"
          sx={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          Построить прогноз
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default PredictionTools;
