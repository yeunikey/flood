import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/shared/model/auth";
import {
  AnalyticSite,
  useAnalyticSites,
} from "@/features/analytic/model/useAnalyticSites";
import { fetchChartData } from "@/features/analytic/model/fetchCategory";
import { calcStats } from "@/features/analytic/model/stats";
import DataSource from "@/entities/source/types/sources";
import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import Variable from "@/entities/variable/types/variable";
import { Category } from "@/entities/category/types/categories";
import { GroupedData } from "@/shared/model/types/response";

const processData = (data: GroupedData[], variableId: number) => {
  if (!data.length)
    return { dates: [], values: [], cleanValues: [], hasData: false };

  const points = data
    .map((d) => {
      const valObj = d.values.find((v) => v.variable.id === variableId);
      let val: number | null = null;
      if (valObj && valObj.value !== undefined && valObj.value !== "") {
        const norm = String(valObj.value).replace(",", ".");
        const num = Number(norm);
        if (!isNaN(num)) val = num;
      }
      return {
        time: new Date(d.group.date_utc).getTime(),
        val,
      };
    })
    .sort((a, b) => a.time - b.time);

  let minDiff = Infinity;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].time - points[i - 1].time;
    if (diff > 0 && diff < minDiff) minDiff = diff;
  }

  if (minDiff === Infinity) minDiff = 0;

  const threshold = minDiff > 0 ? minDiff * 5 : Infinity;

  const finalDates: Date[] = [];
  const finalValues: (number | null)[] = [];
  const cleanValues: number[] = [];

  points.forEach((p, i) => {
    if (i > 0 && minDiff > 0) {
      const diff = p.time - points[i - 1].time;
      if (diff > threshold) {
        finalDates.push(new Date(points[i - 1].time + minDiff));
        finalValues.push(null);
      }
    }
    finalDates.push(new Date(p.time));
    finalValues.push(p.val);
    if (p.val !== null) cleanValues.push(p.val);
  });

  return {
    dates: finalDates,
    values: finalValues,
    cleanValues,
    hasData: cleanValues.length > 0,
  };
};

const ChartItem = ({
  site,
  category,
  variables,
}: {
  site: AnalyticSite;
  category: Category;
  variables: Variable[];
}) => {
  const { token } = useAuth();
  const { isVariableDisabled, fromDate, toDate } = useAnalyticStore();
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  const prevFetchParams = useRef<{
    from: number | undefined;
    to: number | undefined;
    sourceId: number | undefined;
  }>({
    from: undefined,
    to: undefined,
    sourceId: undefined,
  });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const fetchSources = async () => {
      try {
        const params: Record<string, string | number> = {
          siteCode: site.code,
        };
        const { data } = await api.get<
          ApiResponse<{ variables: Variable[]; sources: DataSource[] }>
        >(`/data/category/${category.id}/variables`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
          signal: controller.signal,
        });

        setAvailableSources(data.data.sources);
        if (data.data.sources.length > 0 && !selectedSource) {
          setSelectedSource(data.data.sources[0]);
        }
      } catch {}
    };

    fetchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, site.code, token]);

  useEffect(() => {
    if (!token) return;

    const fromTime = fromDate?.getTime();
    const toTime = toDate?.getTime();
    const sourceId = selectedSource?.id;

    const paramsChanged =
      prevFetchParams.current.from !== fromTime ||
      prevFetchParams.current.to !== toTime ||
      prevFetchParams.current.sourceId !== sourceId;

    const isLoaded = site.chartResult !== null;

    if (!site.chartLoading && (!isLoaded || paramsChanged)) {
      const controller = new AbortController();

      fetchChartData(token, site, fromDate, toDate, sourceId);

      prevFetchParams.current = {
        from: fromTime,
        to: toTime,
        sourceId: sourceId,
      };

      return () => controller.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    fromDate?.getTime(),
    toDate?.getTime(),
    selectedSource?.id,
    site.id,
    site.chartResult,
    site.chartLoading,
  ]);

  const handleSourceChange = (event: SelectChangeEvent<number>) => {
    const sourceId = Number(event.target.value);
    const source = availableSources.find((s) => s.id === sourceId) || null;
    setSelectedSource(source);
  };

  const data = site.chartResult || [];

  if (site.chartLoading && data.length === 0) {
    return (
      <Paper className="p-4 rounded-lg">
        <Typography>{site.name} — Загрузка...</Typography>
        <LinearProgress className="mt-2" />
      </Paper>
    );
  }

  if (data.length === 0 && !site.chartLoading) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: "white" }}>
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

      {variables.map((variable) => {
        if (isVariableDisabled(category.id, site.id, variable.id)) return null;

        const {
          dates,
          values: numericValues,
          cleanValues,
          hasData,
        } = processData(data, variable.id);

        if (!hasData) return null;

        const stats = calcStats(cleanValues);

        return (
          <Paper
            key={`${category.id}-${site.id}-${variable.id}`}
            elevation={0}
            className="rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative"
          >
            {site.chartLoading && (
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
              {variable.name} — {site.name}
            </Typography>

            <div className="w-full h-[300px]">
              <LineChart
                xAxis={[
                  {
                    data: dates,
                    scaleType: "time",
                    valueFormatter: (date) =>
                      date.toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                  },
                ]}
                series={[
                  {
                    data: numericValues,
                    label: `${variable.name} (${site.name})`,
                    showMark: false,
                    connectNulls: false,
                  },
                ]}
                height={300}
                margin={{ left: 50, right: 30, top: 30, bottom: 30 }}
              />
            </div>

            {stats && (
              <Table size="small" className="mt-2">
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
                    <TableCell>{stats.min}</TableCell>
                    <TableCell>{stats.p25.toFixed(3)}</TableCell>
                    <TableCell>{stats.p50.toFixed(3)}</TableCell>
                    <TableCell>{stats.p75.toFixed(3)}</TableCell>
                    <TableCell>{stats.max}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </Paper>
        );
      })}
    </div>
  );
};

function ChartWidget() {
  const { activeSites } = useAnalyticSites();
  const records = Object.values(activeSites);

  return (
    <div className="p-3 pt-6 mb-24 space-y-12! w-full max-w-full">
      {records.map((record) =>
        record.sites.map((site) => (
          <ChartItem
            key={`${record.category.id}-${site.id}`}
            site={site}
            category={record.category}
            variables={record.variables}
          />
        )),
      )}
    </div>
  );
}

export default ChartWidget;
