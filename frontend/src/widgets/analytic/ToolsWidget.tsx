import { ShowChart } from "@mui/icons-material";
import {
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("xl"));
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
      <div className="flex flex-nowrap items-center gap-2 overflow-hidden p-3 sm:gap-3 lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:min-w-max sm:gap-3 lg:gap-6">
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setVariableCollapse(!variableCollapse)}
            aria-label="Переменные"
            sx={{
              flexShrink: 0,
              minWidth: { xs: 40, sm: 64 },
              width: { xs: 40, sm: "auto" },
              px: { xs: 1, sm: 2 },
              whiteSpace: "nowrap",
              "& .MuiButton-startIcon": {
                mr: { xs: 0, sm: 1 },
                ml: { xs: 0, sm: -0.5 },
              },
            }}
          >
            {!isSmallScreen && "Переменные"}
          </Button>

          <Divider
            orientation="vertical"
            flexItem
            className="hidden md:block"
          />

          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 sm:flex-none sm:gap-3 lg:gap-6">
            <div className="flex min-w-0 flex-nowrap items-center gap-1 sm:gap-3">
              <Typography
                color="textSecondary"
                variant="body2"
                sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}
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
                    sx: { width: { xs: 84, sm: 180 }, flexShrink: 1 },
                  },
                }}
              />
            </div>

            <div className="flex min-w-0 flex-nowrap items-center gap-1 sm:gap-3">
              <Typography
                color="textSecondary"
                variant="body2"
                sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}
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
                    sx: { width: { xs: 84, sm: 180 }, flexShrink: 1 },
                  },
                }}
              />
            </div>
          </div>

          {!showDependencies && (
            <div className="shrink-0">
              <ToggleButtonGroup
                color="primary"
                value={viewMode}
                exclusive
                onChange={(_, a) => setViewMode(a)}
                aria-label="Platform"
                size="small"
                sx={{
                  flexShrink: 0,
                  "& .MuiToggleButton-root": {
                    minWidth: { xs: 42, sm: 64 },
                    px: { xs: 0.75, sm: 3 },
                    fontSize: { xs: 12, sm: 14 },
                  },
                }}
              >
                <ToggleButton value="table">
                  Табличный
                </ToggleButton>
                <ToggleButton value="chart">
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
          aria-label={!showDependencies ? "Построить зависимости" : "Обратно"}
          sx={{
            flexShrink: 0,
            minWidth: { xs: 40, sm: 64 },
            width: { xs: 40, sm: "auto" },
            px: { xs: 1, sm: 2 },
            whiteSpace: "nowrap",
            "& .MuiButton-startIcon": {
              mr: { xs: 0, sm: 1 },
              ml: { xs: 0, sm: -0.5 },
            },
          }}
        >
          {!isSmallScreen &&
            (!showDependencies ? "Построить зависимости" : "Обратно")}
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default ToolsWidget;
