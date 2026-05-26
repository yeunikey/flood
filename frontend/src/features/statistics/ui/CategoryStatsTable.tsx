import {
  formatStatisticDate,
  formatStatisticNumber,
} from "@/features/statistics/model/format";
import { CategoryStats, SiteStats } from "@/features/statistics/model/types";
import AssessmentIcon from "@mui/icons-material/Assessment";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
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
import { Fragment, useState } from "react";

interface CategoryStatsTableProps {
  categories: CategoryStats[];
  loading: boolean;
  lastDataDate: string | null;
  maxValuesCount: number;
}

function MobileCategoryCard({
  category,
  progress,
  expanded,
  onToggle,
}: {
  category: CategoryStats;
  progress: number;
  expanded: boolean;
  onToggle: () => void;
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
        <ButtonBase
          onClick={onToggle}
          aria-expanded={expanded}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            textAlign: "left",
            gap: 1,
            width: "100%",
            borderRadius: 1,
          }}
        >
          <Box>
            <Typography fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
              {category.categoryName}
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              {formatStatisticNumber(category.sites?.length ?? 0)} точек ·
              Последняя дата: {formatStatisticDate(category.lastDate)}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon
            color="action"
            sx={{
              flexShrink: 0,
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 150ms",
            }}
          />
        </ButtonBase>

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

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              pt: 0.5,
            }}
          >
            <Typography fontSize={13} fontWeight={600} color="text.secondary">
              Статистика по точкам
            </Typography>
            {(category.sites ?? []).map((site) => (
              <MobileSiteCard key={site.siteId} site={site} />
            ))}
            {!category.sites?.length && (
              <Typography color="text.secondary" fontSize={13}>
                Нет точек с данными
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}

function MobileSiteCard({ site }: { site: SiteStats }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        p: 1,
        bgcolor: "grey.50",
      }}
    >
      <Typography fontWeight={500} fontSize={14}>
        {site.siteName}
      </Typography>
      <Typography color="text.secondary" fontSize={12} sx={{ mb: 0.75 }}>
        Код: {site.siteCode} · Последняя дата:{" "}
        {formatStatisticDate(site.lastDate)}
      </Typography>
      <Typography color="text.secondary" fontSize={12}>
        Группы: {formatStatisticNumber(site.groupsCount)} · Значения:{" "}
        {formatStatisticNumber(site.valuesCount)} · Переменные:{" "}
        {formatStatisticNumber(site.variablesCount)}
      </Typography>
    </Box>
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
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null,
  );

  const toggleCategory = (categoryId: number) => {
    setExpandedCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
  };

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
              Раскройте категорию, чтобы посмотреть статистику каждой точки
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
                expanded={expandedCategoryId === category.categoryId}
                onToggle={() => toggleCategory(category.categoryId)}
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
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
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

                const expanded = expandedCategoryId === category.categoryId;

                return (
                  <Fragment key={category.categoryId}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          aria-label={
                            expanded
                              ? "Скрыть статистику точек"
                              : "Показать статистику точек"
                          }
                          aria-expanded={expanded}
                          onClick={() => toggleCategory(category.categoryId)}
                        >
                          <KeyboardArrowDownIcon
                            sx={{
                              transform: expanded ? "rotate(180deg)" : "none",
                              transition: "transform 150ms",
                            }}
                          />
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography fontWeight={500}>
                          {category.categoryName}
                        </Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {formatStatisticNumber(category.sites?.length ?? 0)}{" "}
                          точек
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
                            <Typography
                              sx={{ fontVariantNumeric: "tabular-nums" }}
                            >
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
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ p: 0, borderBottom: expanded ? undefined : 0 }}
                      >
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 3, py: 2, bgcolor: "grey.50" }}>
                            <Typography fontWeight={600} sx={{ mb: 1.5 }}>
                              Статистика по точкам
                            </Typography>
                            {(category.sites ?? []).length ? (
                              <Table
                                size="small"
                                aria-label="Статистика по точкам"
                              >
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Точка</TableCell>
                                    <TableCell>Код</TableCell>
                                    <TableCell align="right">Группы</TableCell>
                                    <TableCell align="right">
                                      Значения
                                    </TableCell>
                                    <TableCell align="right">
                                      Переменные
                                    </TableCell>
                                    <TableCell>Последняя дата</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(category.sites ?? []).map((site) => (
                                    <TableRow key={site.siteId}>
                                      <TableCell>{site.siteName}</TableCell>
                                      <TableCell>{site.siteCode}</TableCell>
                                      <TableCell align="right">
                                        {formatStatisticNumber(
                                          site.groupsCount,
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatStatisticNumber(
                                          site.valuesCount,
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatStatisticNumber(
                                          site.variablesCount,
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {formatStatisticDate(site.lastDate)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography color="text.secondary">
                                Нет точек с данными
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}

              {!categories.length && (
                <TableRow>
                  <TableCell colSpan={6}>
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
