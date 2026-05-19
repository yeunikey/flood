import {
  formatStatisticDate,
  formatStatisticNumber,
} from "@/features/statistics/model/format";
import { CategoryStats } from "@/features/statistics/model/types";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface CategoryStatsTableProps {
  categories: CategoryStats[];
  loading: boolean;
  lastDataDate: string | null;
  maxValuesCount: number;
}

function MobileCategoryCard({
  category,
  progress,
}: {
  category: CategoryStats;
  progress: number;
}) {
  const items = [
    { label: "Группы", value: category.groupsCount },
    { label: "Значения", value: category.valuesCount },
    { label: "Переменные", value: category.variablesCount },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Box>
          <Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
            {category.categoryName}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            Последняя дата: {formatStatisticDate(category.lastDate)}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 1 }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 1,
                minWidth: 0,
              }}
            >
              <Typography color="text.secondary" fontSize={12} noWrap>
                {item.label}
              </Typography>
              <Typography
                fontWeight={600}
                sx={{
                  fontSize: 15,
                  fontVariantNumeric: "tabular-nums",
                  overflowWrap: "anywhere",
                }}
              >
                {formatStatisticNumber(item.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

export default function CategoryStatsTable({
  categories,
  loading,
  lastDataDate,
  maxValuesCount,
}: CategoryStatsTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <AssessmentIcon color="primary" sx={{ mt: 0.25 }} />
          <Box>
            <Typography fontWeight={600}>Статистика по категориям</Typography>
            <Typography color="text.secondary" fontSize={14}>
              Группы, значения, переменные и последняя дата данных
            </Typography>
          </Box>
        </Box>

        <Chip
          label={`Последние данные: ${formatStatisticDate(lastDataDate)}`}
          color={lastDataDate ? "primary" : "default"}
          variant="outlined"
          sx={{
            maxWidth: "100%",
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      </Box>

      <Divider />

      {loading ? (
        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            p: 1.5,
          }}
        >
          {categories.map((category) => {
            const progress = maxValuesCount
              ? (category.valuesCount / maxValuesCount) * 100
              : 0;

            return (
              <MobileCategoryCard
                key={category.categoryId}
                category={category}
                progress={progress}
              />
            );
          })}

          {!categories.length && (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Нет категорий для отображения
            </Typography>
          )}
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Категория</TableCell>
                <TableCell align="right">Группы</TableCell>
                <TableCell align="right">Значения</TableCell>
                <TableCell align="right">Переменные</TableCell>
                <TableCell>Последняя дата</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => {
                const progress = maxValuesCount
                  ? (category.valuesCount / maxValuesCount) * 100
                  : 0;

                return (
                  <TableRow key={category.categoryId} hover>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography fontWeight={500}>
                        {category.categoryName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatStatisticNumber(category.groupsCount)}
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 180 }}>
                      <Tooltip
                        title={formatStatisticNumber(category.valuesCount)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ width: 72 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {formatStatisticNumber(category.valuesCount)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {formatStatisticNumber(category.variablesCount)}
                    </TableCell>
                    <TableCell>
                      {formatStatisticDate(category.lastDate)}
                    </TableCell>
                  </TableRow>
                );
              })}

              {!categories.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" align="center">
                      Нет категорий для отображения
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
