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

function ToolsWidget() {
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
    setPage,
  } = useAnalyticStore();

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
                value={fromDate}
                minDate={globalMinDate || undefined}
                maxDate={!toDate ? globalMaxDate || undefined : toDate}
                onChange={(newValue: Date | null) => {
                  setFromDate(newValue);
                  setPage(0);
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
                value={toDate}
                minDate={!fromDate ? globalMinDate || undefined : fromDate}
                maxDate={globalMaxDate || undefined}
                onChange={(newValue: Date | null) => {
                  setToDate(newValue);
                  setPage(0);
                }}
                slotProps={{ textField: { size: "small" } }}
              />
            </div>
          </div>

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
          Построить зависимости
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default ToolsWidget;
