/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Paper,
  Typography,
  Tooltip,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Stack,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { fetchChartData } from "@/features/analytic/model/fetchCategory";
import { useAnalyticSites } from "@/features/analytic/model/useAnalyticSites";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { pearson, spearman } from "@/features/analytic/model/corallation";

const CELL_SIZE = 48;
const ROW_HEADER_WIDTH = 220;
const MIN_COL_HEADER_HEIGHT = 160;

interface SeriesData {
  id: string;
  label: string;
  rawMap: Map<string, number>;
}

const CorrelationCell = React.memo(
  function CorrelationCell({
    r,
    labelX,
    labelY,
    cutoff,
  }: {
    r: number;
    labelX: string;
    labelY: string;
    cutoff: number;
  }) {
    const absR = Math.abs(r);
    const isBelowCutoff = absR < cutoff;

    const bgColor = isBelowCutoff ? "#f5f5f5" : `rgba(0, 82, 204, ${absR})`;
    const textColor = isBelowCutoff ? "#ccc" : absR > 0.6 ? "#fff" : "#000";
    const opacity = isBelowCutoff ? 0.3 : 1;

    return (
      <Tooltip
        title={`${labelY} ↔ ${labelX}: ${r.toFixed(4)}`}
        arrow
        enterDelay={0}
      >
        <Box
          sx={{
            width: CELL_SIZE,
            minWidth: CELL_SIZE,
            height: CELL_SIZE,
            minHeight: CELL_SIZE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: bgColor,
            color: textColor,
            borderBottom: "1px solid #e0e0e0",
            borderRight: "1px solid #e0e0e0",
            fontSize: "0.65rem",
            fontWeight: "medium",
            cursor: "default",
            opacity: opacity,
            flexShrink: 0,
            alignSelf: "stretch",
            transition: "opacity 0.2s, background-color 0.2s",
            "&:hover": {
              zIndex: 1,
              opacity: 1,
              boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.5)",
            },
          }}
        >
          {!isBelowCutoff && (r === 1 ? "1.0" : r.toFixed(2))}
        </Box>
      </Tooltip>
    );
  },
  (prev, next) => {
    return (
      prev.r === next.r &&
      prev.cutoff === next.cutoff &&
      prev.labelX === next.labelX &&
      prev.labelY === next.labelY
    );
  },
);

const DependencyWidget: React.FC = () => {
  const { token } = useAuth();
  const { activeSites } = useAnalyticSites();
  const { isVariableDisabled, fromDate, toDate } = useAnalyticStore();

  const [method, setMethod] = useState<"pearson" | "spearman">("pearson");
  const [cutoff, setCutoff] = useState<number>(0);

  const prevDatesRef = useRef({ from: fromDate, to: toDate });

  const records = useMemo(() => Object.values(activeSites), [activeSites]);

  const sitesFingerprint = useMemo(
    () =>
      records
        .flatMap((r) => r.sites.map((s) => s.id))
        .sort()
        .join(","),
    [records],
  );

  const chartDataDeps = useMemo(() => {
    return records.flatMap((r) => r.sites.map((s) => s.chartResult));
  }, [records]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const datesChanged =
      prevDatesRef.current.from !== fromDate ||
      prevDatesRef.current.to !== toDate;

    records.forEach((record) => {
      record.sites.forEach((site) => {
        if (!site.chartLoading && (!site.chartResult || datesChanged)) {
          fetchChartData(
            token,
            site,
            fromDate,
            toDate,
            undefined,
          );
        }
      });
    });

    prevDatesRef.current = { from: fromDate, to: toDate };

    return () => controller.abort();
  }, [token, fromDate, toDate, sitesFingerprint, records]);

  const allPotentialSeries = useMemo(() => {
    const list: {
      id: string;
      label: string;
      catId: number;
      siteId: number;
      varId: number;
    }[] = [];

    records.forEach((record) => {
      record.sites.forEach((site) => {
        if (!site.chartResult) return;

        record.variables.forEach((variable) => {
          list.push({
            id: `${record.category.id}-${site.id}-${variable.id}`,
            label: `${site.name} / ${variable.name}`,
            catId: record.category.id,
            siteId: site.id,
            varId: variable.id,
          });
        });
      });
    });
    return list;
  }, [records, chartDataDeps]);

  const matrix = useMemo(() => {
    const activeSeriesData: SeriesData[] = [];
    const timestampsSet = new Set<string>();

    allPotentialSeries.forEach((item) => {
      if (isVariableDisabled(item.catId, item.siteId, item.varId)) return;

      const record = activeSites[item.catId];
      if (!record) return;

      const site = record.sites.find((s) => s.id === item.siteId);
      if (!site || !site.chartResult) return;

      const dataMap = new Map<string, number>();
      site.chartResult.forEach((d) => {
        const valObj = d.values.find((v: any) => v.variable.id === item.varId);
        if (valObj) {
          const val = valObj.value;
          if (val !== undefined && val !== null && val !== "") {
            const num = Number(String(val).replace(",", "."));
            if (!isNaN(num)) {
              dataMap.set(d.group.date_utc, num);
              timestampsSet.add(d.group.date_utc);
            }
          }
        }
      });

      if (dataMap.size > 0) {
        activeSeriesData.push({
          id: item.id,
          label: item.label,
          rawMap: dataMap,
        });
      }
    });

    if (activeSeriesData.length === 0) return null;

    const timestamps = Array.from(timestampsSet).sort();
    const resultMatrix: { x: string; y: string; r: number }[] = [];

    for (let i = 0; i < activeSeriesData.length; i++) {
      for (let j = 0; j < activeSeriesData.length; j++) {
        const s1 = activeSeriesData[i];
        const s2 = activeSeriesData[j];

        if (i === j) {
          resultMatrix.push({ x: s1.label, y: s2.label, r: 1 });
          continue;
        }

        const commonTimes = timestamps.filter(
          (t) => s1.rawMap.has(t) && s2.rawMap.has(t),
        );

        if (commonTimes.length < 3) {
          resultMatrix.push({ x: s1.label, y: s2.label, r: 0 });
          continue;
        }

        const v1 = commonTimes.map((t) => s1.rawMap.get(t)!);
        const v2 = commonTimes.map((t) => s2.rawMap.get(t)!);

        let correlationValue = 0;
        if (method === "pearson") {
          correlationValue = pearson(v1, v2).r;
        } else {
          correlationValue = spearman(v1, v2).rho;
        }

        resultMatrix.push({
          x: s1.label,
          y: s2.label,
          r: isNaN(correlationValue) ? 0 : correlationValue,
        });
      }
    }

    return {
      labels: activeSeriesData.map((s) => s.label),
      data: resultMatrix,
    };
  }, [
    activeSites,
    isVariableDisabled,
    allPotentialSeries,
    method,
    chartDataDeps,
  ]);

  const handleCutoffChange = (event: Event, newValue: number | number[]) => {
    setCutoff(newValue as number);
  };

  const handleCutoffInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = parseFloat(event.target.value);
    if (!isNaN(val) && val >= 0 && val <= 1) {
      setCutoff(val);
    }
  };

  const isLoading = records.some((r) => r.sites.some((s) => s.chartLoading));

  if (!matrix) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {isLoading ? (
          <>
            <CircularProgress size={24} />
            <Typography color="text.secondary">Загрузка данных...</Typography>
          </>
        ) : (
          <Typography color="text.secondary">
            Нет данных для корреляции. Выберите сайты или измените период.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <div className="w-full max-w-full p-3 pt-6">
      <Paper
        elevation={0}
        className="border border-gray-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-6"
        sx={{ width: "100%" }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold">
            Метод:
          </Typography>
          <ToggleButtonGroup
            value={method}
            exclusive
            onChange={(_, val) => val && setMethod(val)}
            size="small"
          >
            <ToggleButton value="pearson">Пирсон</ToggleButton>
            <ToggleButton value="spearman">Спирмен</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ minWidth: 300 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Cutoff:
          </Typography>
          <Slider
            value={cutoff}
            onChange={handleCutoffChange}
            min={0}
            max={1}
            step={0.01}
            size="small"
            sx={{ width: 120, mx: 2 }}
          />
          <TextField
            value={cutoff}
            onChange={handleCutoffInputChange}
            size="small"
            type="number"
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            sx={{ width: 128 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">R</InputAdornment>,
            }}
          />
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        className="border border-gray-200 rounded-lg! overflow-hidden"
        sx={{
          width: "100%",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr",
        }}
      >
        <Box sx={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `${ROW_HEADER_WIDTH}px repeat(${matrix.labels.length}, ${CELL_SIZE}px)`,
              width: "max-content",
              minWidth: "100%",
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 3,
                bgcolor: "#f8fafc",
                borderBottom: "1px solid #d1d5db",
                borderRight: "1px solid #d1d5db",
                width: ROW_HEADER_WIDTH,
                height: "auto",
                minHeight: MIN_COL_HEADER_HEIGHT,
                minWidth: ROW_HEADER_WIDTH,
                flexShrink: 0,
                alignSelf: "stretch",
              }}
            />

            {matrix.labels.map((label, i) => (
              <Box
                key={`header-${i}`}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  bgcolor: "#f8fafc",
                  p: 0.5,
                  borderBottom: "1px solid #d1d5db",
                  borderRight: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "auto",
                  maxHeight: "250px",
                  minHeight: MIN_COL_HEADER_HEIGHT,
                  width: CELL_SIZE + 6,
                  minWidth: CELL_SIZE + 6,
                  flexShrink: 0,
                  alignSelf: "stretch",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  overflow: "hidden",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "medium",
                    fontSize: "11px",
                    transform: "rotate(0deg)",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    lineHeight: 1.1,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}

            {matrix.labels.map((labelY, i) => (
              <React.Fragment key={`row-${i}`}>
                <Box
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    bgcolor: "#f8fafc",
                    p: 1,
                    borderBottom: "1px solid #e2e8f0",
                    borderRight: "1px solid #d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    width: ROW_HEADER_WIDTH,
                    minWidth: ROW_HEADER_WIDTH,
                    height: CELL_SIZE,
                    flexShrink: 0,
                    alignSelf: "stretch",
                    overflow: "hidden",
                    whiteSpace: "normal",
                  }}
                >
                  <Typography
                    variant="caption"
                    title={labelY}
                    sx={{
                      fontWeight: "medium",
                      fontSize: "11px",
                      textAlign: "right",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {labelY}
                  </Typography>
                </Box>

                {matrix.labels.map((labelX, j) => {
                  const item = matrix.data.find(
                    (d) => d.x === labelX && d.y === labelY,
                  );
                  const r = item?.r ?? 0;

                  return (
                    <CorrelationCell
                      key={`cell-${i}-${j}`}
                      r={r}
                      labelX={labelX}
                      labelY={labelY}
                      cutoff={cutoff}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default DependencyWidget;