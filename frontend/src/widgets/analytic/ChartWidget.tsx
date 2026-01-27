import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  LinearProgress,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { useEffect, useRef } from "react";
import { useAuth } from "@/shared/model/auth";
import { useAnalyticSites } from "@/features/analytic/model/useAnalyticSites";
import { fetchChartData } from "@/features/analytic/model/fetchCategory";
import { calcStats } from "@/features/analytic/model/stats";

function ChartWidget() {
  const { token } = useAuth();
  const { activeSites } = useAnalyticSites();
  const { isVariableDisabled, fromDate, toDate } = useAnalyticStore();

  const records = Object.values(activeSites);

  const sitesFingerprint = records
    .flatMap((r) => r.sites.map((s) => s.id))
    .sort()
    .join(",");

  const prevDatesRef = useRef({ from: fromDate, to: toDate });

  useEffect(() => {
    if (!token) return;

    const datesChanged =
      prevDatesRef.current.from !== fromDate ||
      prevDatesRef.current.to !== toDate;

    records.forEach((record) => {
      record.sites.forEach((site) => {
        if (!site.chartLoading && (!site.chartResult || datesChanged)) {
          fetchChartData(token, site, fromDate, toDate);
        }
      });
    });

    prevDatesRef.current = { from: fromDate, to: toDate };
  }, [token, fromDate, toDate, sitesFingerprint]);

  return (
    <div className="p-3 pt-6 mb-24 space-y-12! w-full max-w-full">
      {records.map((record) =>
        record.sites.map((site) => {
          const data = site.chartResult || [];

          if (site.chartLoading && data.length === 0) {
            return (
              <Paper
                key={`${record.category.id}-${site.id}-loading`}
                className="p-4 rounded-lg"
              >
                <Typography>{site.name} — Загрузка...</Typography>
                <LinearProgress className="mt-2" />
              </Paper>
            );
          }

          if (data.length === 0) return null;

          const dates = data.map((d) => new Date(d.group.date_utc));

          return record.variables.map((variable) => {
            if (isVariableDisabled(record.category.id, site.id, variable.id)) {
              return null;
            }

            const rawValues = data.map((d) => {
              const val = d.values.find((v) => v.variable.id === variable.id);
              return val?.value ?? null;
            });

            const numericValues = rawValues.map((v) => {
              if (v === null || v === undefined || v === "") return null;
              const normalized = String(v).replace(",", ".");
              const num = Number(normalized);
              return isNaN(num) ? null : num;
            });

            const isNumeric = numericValues.some((v) => v !== null);
            const stats = isNumeric ? calcStats(numericValues) : null;
            const validDataPoints = numericValues.filter(
              (v) => v !== null,
            ).length;

            if (validDataPoints === 0) return null;

            return (
              <Paper
                key={`${record.category.id}-${site.id}-${variable.id}`}
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
                        connectNulls: true,
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
          });
        }),
      )}
    </div>
  );
}

export default ChartWidget;
