/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/shared/model/auth";
import { useMonitorStore } from "../model/useMontorStore";
import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import { useDisabledVariables } from "../model/useDisabledVariables";
import VariablesSettingsModal from "../modal/VariablesSettingsModal";
import {
  Button,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Zoom,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import { LineChart } from "@mui/x-charts/LineChart";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Variable from "@/entities/variable/types/variable";
import DataSource from "@/entities/source/types/sources";

interface ChartValue {
  date: string;
  value: number;
}

interface Stats {
  mean: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
}

interface VariablesResponse {
  variables: Variable[];
  sources: DataSource[];
}

interface GroupedData {
  group: {
    id: number;
    date_utc: string;
    category: { id: number; name: string };
    site: { id: number; code: string; name: string };
    source: DataSource;
  };
  values: {
    id: number;
    value: string;
    variable: Variable;
  }[];
}

const calculateStats = (inputValues: number[]): Stats | null => {
  if (inputValues.length === 0) return null;
  const values = [...inputValues].sort((a, b) => a - b);

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const squareDiffs = values.map((v) => (v - mean) ** 2);
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(avgSquareDiff);

  const quantile = (q: number) => {
    const pos = (values.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (values[base + 1] !== undefined) {
      return values[base] + rest * (values[base + 1] - values[base]);
    }
    return values[base];
  };

  return {
    mean,
    std,
    min: values[0],
    max: values[values.length - 1],
    p25: quantile(0.25),
    p50: quantile(0.5),
    p75: quantile(0.75),
  };
};

function ChartInfo() {
  const { token } = useAuth();
  const { selectedSite, selectedCategory, selectedSource, setSelectedSource } =
    useMonitorStore();
  const { disabledVariables } = useDisabledVariables();

  const [variables, setVariables] = useState<Variable[]>([]);
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);

  const [chartData, setChartData] = useState<Record<number, ChartValue[]>>({});
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [globalMin, setGlobalMin] = useState<Date | null>(new Date());
  const [globalMax, setGlobalMax] = useState<Date | null>(new Date());

  const safeDate = (d: Date | string | null | undefined): Date | undefined => {
    if (!d) return undefined;
    const date = new Date(d);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const getMinFromDate = () => {
    let min = safeDate(globalMin);
    const currentTo = safeDate(toDate);
    if (currentTo) {
      const limitDate = new Date(currentTo);
      limitDate.setFullYear(limitDate.getFullYear() - 10);
      if (!min || limitDate > min) {
        min = limitDate;
      }
    }
    return min;
  };

  const getMaxToDate = () => {
    let max = safeDate(globalMax);
    const currentFrom = safeDate(fromDate);
    if (currentFrom) {
      const limitDate = new Date(currentFrom);
      limitDate.setFullYear(limitDate.getFullYear() + 10);
      if (!max || limitDate < max) {
        max = limitDate;
      }
    }
    return max;
  };

  useEffect(() => {
    if (!selectedCategory || !token) return;

    const controller = new AbortController();

    const fetchVariables = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (selectedSource) params.sourceId = selectedSource.id;
        if (selectedSite) params.siteCode = selectedSite.code;

        const { data } = await api.get<ApiResponse<VariablesResponse>>(
          `/data/category/${selectedCategory.id}/variables`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
            signal: controller.signal,
          },
        );

        setVariables(data.data.variables);
        setAvailableSources(data.data.sources);
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
        }
      }
    };

    fetchVariables();

    return () => controller.abort();
  }, [selectedCategory, token, selectedSite]);

  useEffect(() => {
    if (!selectedSite || !selectedCategory || !token) return;

    const controller = new AbortController();

    const fetchCharts = async () => {
      if (fromDate && toDate) {
        if (fromDate > toDate) return;
        const tenYearsMs = 10 * 365.25 * 24 * 60 * 60 * 1000;
        if (toDate.getTime() - fromDate.getTime() > tenYearsMs) return;
      }

      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (fromDate) params.start = fromDate.toISOString();
        if (toDate) params.end = toDate.toISOString();
        if (selectedSource) params.sourceId = selectedSource.id.toString();

        const res = await api.get<
          ApiResponse<{
            start: Date;
            end: Date;
            minDate: Date;
            maxDate: Date;
            total: number;
            content: GroupedData[];
          }>
        >(
          `/data/category/${selectedCategory.id}/by-site/${selectedSite.code}/by-date`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
            signal: controller.signal,
          },
        );

        if (res.data?.data) {
          const { maxDate, minDate, content } = res.data.data;
          const maxD = new Date(maxDate);
          const minD = new Date(minDate);

          setGlobalMax(maxD);
          setGlobalMin(minD);

          if (!fromDate && !toDate) {
            const start = new Date(maxD);
            start.setDate(maxD.getDate() - 30);
            setFromDate(start);
            setToDate(maxD);
          }

          if (content) {
            if (!selectedSource && content.length > 0) {
              const detectedSource = content[0].group.source;
              if (detectedSource) {
                setSelectedSource(detectedSource);
              }
            }

            const newData: Record<number, ChartValue[]> = {};

            content.forEach((groupItem) => {
              const date = groupItem.group.date_utc;
              groupItem.values.forEach((val) => {
                const numVal = parseFloat(val.value.replace(",", "."));
                if (!isNaN(numVal)) {
                  if (!newData[val.variable.id]) {
                    newData[val.variable.id] = [];
                  }
                  newData[val.variable.id].push({
                    date,
                    value: numVal,
                  });
                }
              });
            });

            Object.keys(newData).forEach((key) => {
              const varId = Number(key);
              newData[varId].sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              );
            });

            setChartData(newData);
          } else {
            setChartData({});
          }
        }
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          setChartData({});
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCharts();

    return () => controller.abort();
  }, [
    selectedSite,
    selectedCategory,
    fromDate,
    toDate,
    token,
    selectedSource,
    setSelectedSource,
  ]);

  const activeVariables = useMemo(
    () => variables.filter((v) => !disabledVariables.includes(v.id)),
    [variables, disabledVariables],
  );

  const handleSourceChange = (event: SelectChangeEvent<number>) => {
    const sourceId = Number(event.target.value);
    const source = availableSources.find((s) => s.id === sourceId) || null;
    setSelectedSource(source);
  };

  return (
    <Zoom in={true} timeout={600}>
      <div className="flex flex-col h-full w-full gap-4">
        <div className="flex-none flex gap-4 items-center flex-wrap bg-white p-2 rounded-lg border border-gray-200">
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setSettingsOpen(true)}
            size="medium"
          >
            Переменные
          </Button>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="flex gap-2 items-center">
              <DatePicker
                label="С"
                value={fromDate}
                minDate={getMinFromDate()}
                maxDate={
                  !toDate
                    ? safeDate(globalMax) || undefined
                    : safeDate(toDate) || undefined
                }
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
              />
              <span className="text-gray-400">—</span>
              <DatePicker
                label="По"
                value={toDate}
                minDate={
                  !fromDate
                    ? safeDate(globalMin) || undefined
                    : safeDate(fromDate) || undefined
                }
                maxDate={getMaxToDate()}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
              />
            </div>
          </LocalizationProvider>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Источник</InputLabel>
            <Select
              value={selectedSource?.id ?? ""}
              label="Источник"
              onChange={handleSourceChange}
            >
              {availableSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <VariablesSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          variables={variables}
        />

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {activeVariables.map((variable) => {
            const data = chartData[variable.id] || [];
            const dates = data.map((d) => new Date(d.date));
            const values = data.map((d) => d.value);
            const stats = calculateStats(values);

            return (
              <Paper
                key={`${variable.id}-${selectedSite?.id}`}
                elevation={0}
                className="rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative"
              >
                {loading && (
                  <LinearProgress
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                )}

                <Typography variant="h6" gutterBottom>
                  {variable.name}
                </Typography>

                <div className="w-full h-[300px]">
                  {data.length > 0 ? (
                    <LineChart
                      xAxis={[
                        {
                          data: dates,
                          scaleType: "time",
                          valueFormatter: (date) =>
                            date.toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                        },
                      ]}
                      series={[
                        {
                          data: values,
                          label: variable.name,
                          showMark: false,
                          connectNulls: true,
                          color: "#1976d2",
                        },
                      ]}
                      height={300}
                      margin={{ left: 50, right: 30, top: 30, bottom: 30 }}
                      key={`${variable.id}-${data.length}`}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Нет данных за выбранный период
                    </div>
                  )}
                </div>

                {stats && (
                  <Table size="small" className="mt-2 border-t border-gray-100">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mean</TableCell>
                        <TableCell>Std</TableCell>
                        <TableCell>Min</TableCell>
                        <TableCell>25%</TableCell>
                        <TableCell>50%</TableCell>
                        <TableCell>75%</TableCell>
                        <TableCell>Max</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{stats.mean.toFixed(3)}</TableCell>
                        <TableCell>{stats.std.toFixed(3)}</TableCell>
                        <TableCell>{stats.min.toFixed(3)}</TableCell>
                        <TableCell>{stats.p25.toFixed(3)}</TableCell>
                        <TableCell>{stats.p50.toFixed(3)}</TableCell>
                        <TableCell>{stats.p75.toFixed(3)}</TableCell>
                        <TableCell>{stats.max.toFixed(3)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </Paper>
            );
          })}
        </div>
      </div>
    </Zoom>
  );
}

export default ChartInfo;
