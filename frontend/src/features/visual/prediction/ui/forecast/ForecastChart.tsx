import { useState } from "react";
import { Download } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import { ForecastDataPoint } from "../../model/forecast.types";

const QUANTILES = { q95: 900, q99: 1200, q995: 1500 };

type Props = {
  data: ForecastDataPoint[];
  issueDate: string;
  aoiName: string;
  isRange: boolean;
};

export default function ForecastChart({
  data,
  issueDate,
  aoiName,
  isRange,
}: Props) {
  const [scale, setScale] = useState<"focus" | "full">("full");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chartHeight = isMobile ? 300 : 400;
  const horizon = isRange ? "выбранный период" : "7 дней";
  const margin = isMobile
    ? { top: 44, right: 18, left: 38, bottom: 34 }
    : { top: 40, right: 100, left: 50, bottom: 30 };

  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        p: 0,
      }}
      elevation={0}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}>
        <Box
          className="flex flex-col gap-1 flex-wrap items-center"
          mb={{ xs: 2, sm: 3 }}
        >
          <Typography variant={isMobile ? "subtitle1" : "h5"} fontWeight="bold">
            {isRange ? "Прогноз за период" : "Прогноз 7 дней"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Гидропост:{" "}
            <Box component="span" fontWeight="medium" color="primary.main">
              {aoiName}
            </Box>{" "}
            · Дата старта: {issueDate} · Горизонт: {horizon}
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems={{ xs: "stretch", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          gap={3}
          mb={2}
        >
          <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Масштаб графика:
          </Typography>
          <ToggleButtonGroup
            color="primary"
            value={scale}
            exclusive
            onChange={(_, value) => value && setScale(value)}
            size="small"
            fullWidth
            sx={{
              height: { sm: 32 },
              width: { xs: "100%", sm: "auto" },
              "& .MuiToggleButton-root": { flex: 1, lineHeight: 1.2 },
            }}
          >
            <ToggleButton value="focus" sx={{ textTransform: "none", px: 2 }}>
              Фокус
            </ToggleButton>
            <ToggleButton value="full" sx={{ textTransform: "none", px: 2 }}>
              Полный
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            height: chartHeight,
            border: 1,
            borderColor: "grey.200",
            borderRadius: 2,
            p: { xs: 0.5, sm: 1 },
            position: "relative",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 10,
              left: { xs: 8, sm: 10 },
              color: "text.secondary",
              zIndex: 1,
            }}
          >
            Расход воды, м³/с (
            {isRange ? "прогноз за период" : "прогноз на 7 дней"})
          </Typography>
          <LineChart
            dataset={data}
            height={chartHeight}
            margin={margin}
            grid={{ horizontal: true }}
            xAxis={[
              {
                scaleType: "point",
                dataKey: "displayDate",
                tickLabelStyle: { fill: "#64748b", fontSize: 12 },
              },
            ]}
            yAxis={[
              {
                min: scale === "full" ? 0 : undefined,
                max: scale === "full" ? 1600 : undefined,
                tickLabelStyle: { fill: "#64748b", fontSize: 12 },
              },
            ]}
            series={[
              {
                dataKey: "predicted",
                label: "Predicted",
                color: "#2563eb",
                showMark: false,
                valueFormatter: (v) => v?.toFixed(1) || "",
              },
              {
                dataKey: "observed",
                label: "Observed",
                color: "#1e293b",
                showMark: false,
                connectNulls: true,
                valueFormatter: (v) => v?.toFixed(1) || "",
              },
            ]}
            sx={{
              ".MuiLineElement-root": { strokeWidth: 2 },
              ".MuiMarkElement-root": { scale: "0.6" },
            }}
          >
            <ChartsReferenceLine
              y={QUANTILES.q995}
              lineStyle={{ stroke: "#7f1d1d", strokeDasharray: "3 3" }}
              label="Q99.5 (1500)"
              labelStyle={{ fill: "#7f1d1d", fontSize: 10 }}
            />
            <ChartsReferenceLine
              y={QUANTILES.q99}
              lineStyle={{ stroke: "#f87171", strokeDasharray: "3 3" }}
              label="Q99 (1200)"
              labelStyle={{ fill: "#f87171", fontSize: 10 }}
            />
            <ChartsReferenceLine
              y={QUANTILES.q95}
              lineStyle={{ stroke: "#eab308", strokeDasharray: "3 3" }}
              label="Q95 (900)"
              labelStyle={{ fill: "#eab308", fontSize: 10 }}
            />
          </LineChart>
        </Box>
        <Box
          display="flex"
          justifyContent="flex-end"
          mt={2}
          sx={{ "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}
        >
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<Download />}
            sx={{
              textTransform: "none",
              borderColor: "grey.300",
              fontWeight: 600,
            }}
          >
            Экспорт CSV ({horizon})
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
