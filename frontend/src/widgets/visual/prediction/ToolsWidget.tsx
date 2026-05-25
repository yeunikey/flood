import { useState } from "react";
import { ShowChart } from "@mui/icons-material";
import {
  Button,
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

type DateMode = "single" | "range";

function ToolsWidget() {
  const [variable, setVariable] = useState<string>("");
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleVariableChange = (event: SelectChangeEvent) => {
    setVariable(event.target.value);
  };

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: DateMode | null,
  ) => {
    if (newMode !== null) {
      setDateMode(newMode);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto p-3 lg:justify-between">
        <div className="flex min-w-max flex-nowrap items-center gap-3 lg:gap-6">
          <FormControl size="small" sx={{ width: { xs: 172, lg: 192 }, flexShrink: 0 }}>
            <InputLabel id="variable-select-label">Переменная</InputLabel>
            <Select
              labelId="variable-select-label"
              value={variable}
              label="Переменная"
              onChange={handleVariableChange}
            >
              <MenuItem value="var1">Переменная 1</MenuItem>
              <MenuItem value="var2">Переменная 2</MenuItem>
              <MenuItem value="var3">Переменная 3</MenuItem>
            </Select>
          </FormControl>

          <Divider
            orientation="vertical"
            flexItem
            className="hidden md:block"
          />

          <div className="flex flex-nowrap items-center gap-3 sm:gap-4">
            <ToggleButtonGroup
              color="primary"
              value={dateMode}
              exclusive
              onChange={handleModeChange}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value="single" className="px-4!">
                День
              </ToggleButton>
              <ToggleButton value="range" className="px-4!">
                Период
              </ToggleButton>
            </ToggleButtonGroup>

            {dateMode === "single" ? (
              <DatePicker
                label="Дата"
                value={singleDate}
                onChange={(newValue) => setSingleDate(newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                  },
                }}
              />
            ) : (
              <Box
                display="flex"
                alignItems="center"
                flexDirection="row"
                gap={1}
                width="auto"
                flexShrink={0}
              >
                <DatePicker
                  label="С"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                    },
                  }}
                />
                <Typography sx={{ flexShrink: 0 }}>-</Typography>
                <DatePicker
                  label="По"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: { xs: 148, sm: 160 }, flexShrink: 0 },
                    },
                  }}
                />
              </Box>
            )}
          </div>
        </div>

        <Button
          variant="contained"
          startIcon={<ShowChart />}
          disableElevation
          sx={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            bgcolor: "#1976d2",
            fontWeight: 500,
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          Построить прогноз
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default ToolsWidget;
