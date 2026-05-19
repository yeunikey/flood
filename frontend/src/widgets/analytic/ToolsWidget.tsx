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

    if (newFromDate && newToDate) {
      if (newFromDate > newToDate) return;
    }

    Object.values(activeSites).forEach((record) => {
      record.sites.forEach((site) => {
        fetchAnalyticData(token, site, 0, 10, newFromDate, newToDate);
        setSiteRowsPerPage(record.category.id, site.id, 10);
        setSitePage(record.category.id, site.id, 0);
      });
    });
  };

  const safeDate = (d: Date | string | null | undefined): Date | undefined => {
    if (!d) return undefined;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setVariableCollapse(!variableCollapse)}
            sx={{ width: { xs: "100%", lg: "auto" } }}
          >
            Переменные
          </Button>

          <Divider
            orientation="vertical"
            flexItem
            className="hidden md:block"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:gap-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <Typography
                color="textSecondary"
                variant="body2"
                sx={{ flexShrink: 0 }}
              >
                от
              </Typography>
              <DatePicker
                label="дд.мм.гггг"
                value={safeDate(fromDate) || null}
                minDate={safeDate(globalMinDate)}
                maxDate={!toDate ? safeDate(globalMaxDate) : safeDate(toDate)}
                onChange={(newValue: Date | null) => {
                  setFromDate(newValue);
                  handleDateChange(newValue, safeDate(toDate) || null);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: { xs: "100%", sm: 180 } },
                  },
                }}
              />
            </div>

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <Typography
                color="textSecondary"
                variant="body2"
                sx={{ flexShrink: 0 }}
              >
                до
              </Typography>
              <DatePicker
                label="дд.мм.гггг"
                value={safeDate(toDate) || null}
                minDate={!fromDate ? safeDate(globalMinDate) : safeDate(fromDate)}
                maxDate={safeDate(globalMaxDate)}
                onChange={(newValue: Date | null) => {
                  setToDate(newValue);
                  handleDateChange(safeDate(fromDate) || null, newValue);
                }}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: { xs: "100%", sm: 180 } },
                  },
                }}
              />
            </div>
          </div>

          {!showDependencies && (
            <div className="w-full sm:w-auto">
              <ToggleButtonGroup
                color="primary"
                value={viewMode}
                exclusive
                onChange={(_, a) => setViewMode(a)}
                aria-label="Platform"
                size="small"
                fullWidth
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <ToggleButton value="table" className="px-6!" sx={{ flex: 1 }}>
                  Табличный
                </ToggleButton>
                <ToggleButton value="chart" className="px-6!" sx={{ flex: 1 }}>
                  График
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          )}
        </div>

        <Button
          variant="contained"
          startIcon={<ShowChart />}
          disableElevation
          onClick={() => setShowDependencies(!showDependencies)}
          color="primary"
          sx={{ width: { xs: "100%", lg: "auto" } }}
        >
          {!showDependencies ? "Построить зависимости" : "Обратно"}
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default ToolsWidget;
