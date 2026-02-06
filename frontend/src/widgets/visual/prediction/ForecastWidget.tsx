import { useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";
import {
  Card,
  CardContent,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from "@mui/material";
import { Download } from "@mui/icons-material";

interface ForecastDataPoint {
  date: string;
  displayDate: string;
  predicted: number;
  observed: number | null;
  [key: string]: string | number | null;
}

const MOCK_DATA: ForecastDataPoint[] = [
  {
    date: "07.01.2026",
    displayDate: "01.07",
    predicted: 396.8,
    observed: 385.5,
  },
  {
    date: "08.01.2026",
    displayDate: "01.08",
    predicted: 428.5,
    observed: 439.3,
  },
  {
    date: "09.01.2026",
    displayDate: "01.09",
    predicted: 583.2,
    observed: 550.4,
  },
  {
    date: "10.01.2026",
    displayDate: "01.10",
    predicted: 669.3,
    observed: 613.7,
  },
  {
    date: "11.01.2026",
    displayDate: "01.11",
    predicted: 659.1,
    observed: 633.9,
  },
  {
    date: "12.01.2026",
    displayDate: "01.12",
    predicted: 506.6,
    observed: null,
  },
  {
    date: "13.01.2026",
    displayDate: "01.13",
    predicted: 492.0,
    observed: null,
  },
  {
    date: "14.01.2026",
    displayDate: "01.14",
    predicted: 410.7,
    observed: null,
  },
];

const QUANTILES = {
  q95: 900,
  q99: 1200,
  q995: 1500,
};

const ForecastSummary = () => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            Сводка по прогнозу
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Ед.изм: м³/с
        </Typography>

        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={2}>
          <Box
            sx={{
              bgcolor: "grey.50",
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: "grey.200",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              Пик (max predicted)
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 1, fontWeight: "bold", color: "text.primary" }}
            >
              669.3 м³/с
            </Typography>
            <Typography variant="caption" color="text.secondary">
              дата: 10.01.2026
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "grey.50",
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: "grey.200",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              Относительно квантилей
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              ниже Q95
            </Typography>
            <Typography variant="caption" color="text.secondary">
              превышений нет
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ForecastTable = ({ data }: { data: ForecastDataPoint[] }) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>
                Дата
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", color: "text.secondary" }}
              >
                Predicted
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", color: "text.secondary" }}
              >
                Observed
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.date}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ color: "text.secondary" }}
                >
                  {row.date}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {row.predicted.toFixed(1)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: row.observed ? "success.main" : "grey.400",
                  }}
                >
                  {row.observed ? row.observed.toFixed(1) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

const ChartSection = () => {
  const [scale, setScale] = useState<"focus" | "full">("full");

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
      elevation={0}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h6" fontWeight="bold">
            Прогноз 7 дней
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Гидропост:{" "}
            <Box component="span" fontWeight="medium" color="primary.main">
              Шемонаиха
            </Box>{" "}
            · Дата старта: 07.01.2026 · Горизонт: 7 дней
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="body2" fontWeight="bold" color="text.secondary">
            Масштаб графика:
          </Typography>
          <ToggleButtonGroup
            color="primary"
            value={scale}
            exclusive
            onChange={(_, val) => val && setScale(val)}
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="focus" sx={{ textTransform: "none", px: 2 }}>
              Фокус (по прогнозу)
            </ToggleButton>
            <ToggleButton value="full" sx={{ textTransform: "none", px: 2 }}>
              Полный (включая Q-квантили)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            height: 400,
            border: 1,
            borderColor: "grey.200",
            borderRadius: 2,
            p: 1,
            position: "relative",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              color: "text.secondary",
              zIndex: 1,
            }}
          >
            Расход воды, м³/с (прогноз на 7 дней)
          </Typography>
          <LineChart
            dataset={MOCK_DATA}
            margin={{ top: 40, right: 100, left: 50, bottom: 30 }}
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

        <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
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
            Экспорт CSV (7 дней)
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function ForecastWidget() {
  return (
    <div className="p-3">
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
          }}
        >
          <ChartSection />
          <Box display="flex" flexDirection="column" gap={3}>
            <ForecastSummary />
            <ForecastTable data={MOCK_DATA} />
          </Box>
        </Box>
      </Box>
    </div>
  );
}
