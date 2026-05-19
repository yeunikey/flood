"use client";

import { useStatistics } from "@/features/statistics/model/useStatistics";
import CategoryStatsTable from "@/features/statistics/ui/CategoryStatsTable";
import StatTile from "@/features/statistics/ui/StatTile";
import CategoryIcon from "@mui/icons-material/Category";
import DatasetIcon from "@mui/icons-material/Dataset";
import FunctionsIcon from "@mui/icons-material/Functions";
import RefreshIcon from "@mui/icons-material/Refresh";
import TableRowsIcon from "@mui/icons-material/TableRows";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

export default function StatisticsWidget() {
  const {
    stats,
    loading,
    error,
    maxValuesCount,
    lastDataDate,
    refresh,
    canRefresh,
  } = useStatistics();

  return (
    <Box
      sx={{
        width: "100%",
        p: { xs: 2, sm: 3, lg: 6 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, sm: 3, lg: 6 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box className="space-y-2!">
          <Typography
            variant="h4"
            fontWeight={600}
            sx={{ fontSize: { xs: 24, sm: 28, md: 34 } }}
          >
            Статистика данных
          </Typography>
          <Typography
            color="text.secondary"
            fontSize={14}
            sx={{ maxWidth: { xs: "100%", sm: 560 } }}
          >
            Сводка по загруженным данным и категориям
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={refresh}
          disabled={loading || !canRefresh}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Обновить
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        <StatTile
          label="Значения"
          value={stats?.dataValues ?? 0}
          icon={<DatasetIcon />}
        />
        <StatTile
          label="Переменные"
          value={stats?.variables ?? 0}
          icon={<FunctionsIcon />}
        />
        <StatTile
          label="Категории"
          value={stats?.categories ?? 0}
          icon={<CategoryIcon />}
        />
        <StatTile
          label="Группы"
          value={stats?.groups ?? 0}
          icon={<TableRowsIcon />}
        />
      </Box>

      <CategoryStatsTable
        categories={stats?.byCategory ?? []}
        loading={loading && !stats}
        lastDataDate={lastDataDate}
        maxValuesCount={maxValuesCount}
      />
    </Box>
  );
}
