import { ShowChart } from "@mui/icons-material";
import {
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TuneIcon from "@mui/icons-material/Tune";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { useAuth } from "@/shared/model/auth";
import { fetchAnalyticData } from "@/features/analytic/model/fetchCategory";
import { useAnalyticSites } from "@/features/analytic/model/useAnalyticSites";

function ToolsWidget() {
  const { token } = useAuth();
  const {
    variableCollapse,
    fromDate,
    toDate,
    viewMode,
    showDependencies,
    globalMinDate,
    globalMaxDate,
    setVariableCollapse,
    setFromDate,
    setToDate,
    setViewMode,
    setShowDependencies,
  } = useAnalyticStore();

  const { activeSites, setSiteRowsPerPage, setSitePage } = useAnalyticSites();

  const handleDateChange = (
    newFromDate: Date | null,
    newToDate: Date | null,
  ) => {
    if (!token) return;

    // Блокируем запрос, если диапазон некорректен
    if (newFromDate && newToDate) {
      if (newFromDate > newToDate) return;

      const tenYearsMs = 10 * 365.25 * 24 * 60 * 60 * 1000;
      if (newToDate.getTime() - newFromDate.getTime() > tenYearsMs) {
        return;
      }
    }

    Object.values(activeSites).forEach((record) => {
      record.sites.forEach((site) => {
        fetchAnalyticData(token, site, 0, 10, newFromDate, newToDate);
        setSiteRowsPerPage(record.category.id, site.id, 10);
        setSitePage(record.category.id, site.id, 0);
      });
    });
  };

  // Хелпер для безопасного преобразования в Date
  const safeDate = (d: Date | string | null | undefined): Date | undefined => {
    if (!d) return undefined;
    const date = new Date(d);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const getMinFromDate = () => {
    let min = safeDate(globalMinDate);
    const currentTo = safeDate(toDate);

    if (currentTo) {
      const limitDate = new Date(currentTo);
      limitDate.setFullYear(limitDate.getFullYear() - 10);

      // Мы хотим самое ПОЗДНЕЕ из ограничений (чтобы сузить диапазон)
      // Если limitDate (2014) > min (1960), то min = 2014
      if (!min || limitDate > min) {
        min = limitDate;
      }
    }
    return min;
  };

  const getMaxToDate = () => {
    let max = safeDate(globalMaxDate);
    const currentFrom = safeDate(fromDate);

    if (currentFrom) {
      const limitDate = new Date(currentFrom);
      limitDate.setFullYear(limitDate.getFullYear() + 10);

      // Мы хотим самое РАННЕЕ из ограничений
      // Если limitDate (2024) < max (2050), то max = 2024
      if (!max || limitDate < max) {
        max = limitDate;
      }
    }
    return max;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-3">
        <div className="flex flex-wrap items-center gap-6">
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setVariableCollapse(!variableCollapse)}
          >
            Переменные
          </Button>

          <Divider
            orientation="vertical"
            flexItem
            className="hidden md:block"
          />

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Typography color="textSecondary" variant="body2">
                от
              </Typography>
              <DatePicker
                label="дд.мм.гггг"
                value={safeDate(fromDate) || null}
                minDate={getMinFromDate()}
                maxDate={
                  !toDate
                    ? safeDate(globalMaxDate) || undefined
                    : safeDate(toDate) || undefined
                }
                onChange={(newValue: Date | null) => {
                  setFromDate(newValue);
                  handleDateChange(newValue, safeDate(toDate) || null);
                }}
                slotProps={{ textField: { size: "small" } }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Typography color="textSecondary" variant="body2">
                до
              </Typography>
              <DatePicker
                label="дд.мм.гггг"
                value={safeDate(toDate) || null}
                minDate={
                  !fromDate
                    ? safeDate(globalMinDate) || undefined
                    : safeDate(fromDate) || undefined
                }
                maxDate={getMaxToDate()}
                onChange={(newValue: Date | null) => {
                  setToDate(newValue);
                  handleDateChange(safeDate(fromDate) || null, newValue);
                }}
                slotProps={{ textField: { size: "small" } }}
              />
            </div>
          </div>

          {!showDependencies && (
            <div className="">
              <ToggleButtonGroup
                color="primary"
                value={viewMode}
                exclusive
                onChange={(_, a) => setViewMode(a)}
                aria-label="Platform"
                size="small"
              >
                <ToggleButton value="table" className="px-6!">
                  Табличный
                </ToggleButton>
                <ToggleButton value="chart" className="px-6!">
                  График
                </ToggleButton>
              </ToggleButtonGroup>{" "}
            </div>
          )}
        </div>

        <Button
          variant="contained"
          startIcon={<ShowChart />}
          disableElevation
          onClick={() => setShowDependencies(!showDependencies)}
          sx={{
            bgcolor: "#1976d2",
            fontWeight: 500,
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          {!showDependencies ? "Построить зависимости" : "Обратно"}
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default ToolsWidget;
