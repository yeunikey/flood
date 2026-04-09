import {
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useRef } from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import BarChartIcon from "@mui/icons-material/BarChart";
import TableInfo from "./info/TableInfo";
import ChartInfo from "./info/ChartInfo";
import { useMonitorStore } from "./model/useMontorStore";
import DragHandleIcon from "@mui/icons-material/DragHandle";

function SiteInfo() {
  const { selectedSite, setSelectedSite } = useMonitorStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [value, setValue] = useState(0);
  const [height, setHeight] = useState(384);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startY.current - e.clientY;
    const newHeight = Math.max(
      200,
      Math.min(startHeight.current + delta, window.innerHeight - 100),
    );
    setHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startHeight.current = height;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = startY.current - e.touches[0].clientY;
    const newHeight = Math.max(
      160,
      Math.min(startHeight.current + delta, window.innerHeight - 120),
    );
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const content = value === 0 ? <TableInfo /> : <ChartInfo />;

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={selectedSite != null}
        onClose={() => setSelectedSite(null)}
        PaperProps={{
          sx: {
            height: "78dvh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: "hidden",
          },
        }}
      >
        <div className="flex h-full flex-col bg-white">
          <div className="flex items-center justify-center pt-2 pb-1">
            <div className="rounded-full bg-neutral-200 px-3 py-0.5 text-neutral-400">
              <DragHandleIcon className="block h-5!" />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 pb-2">
            <div className="min-w-0 pr-2">
              <div className="truncate text-sm font-semibold text-neutral-900">
                {selectedSite?.name || ""}
              </div>
            </div>

            <Tooltip title="Закрыть">
              <IconButton
                sx={{
                  backgroundColor: "white",
                  color: "#1976d2",
                  "&:hover": { backgroundColor: "#f0f0f0" },
                  boxShadow: 1,
                }}
                size="small"
                onClick={() => setSelectedSite(null)}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </div>

          <Divider orientation="horizontal" />

          <Tabs
            orientation="horizontal"
            variant="fullWidth"
            value={value}
            onChange={handleChange}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label="Таблица"
              icon={<TableRowsIcon />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label="Чарты"
              icon={<BarChartIcon />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>

          <div className="flex-1 min-h-0 overflow-hidden p-3">{content}</div>
        </div>
      </Drawer>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      {selectedSite && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-gray-200 border-[1px] bg-white rounded-full p-0.5 cursor-row-resize z-[101] select-none shadow-sm"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <DragHandleIcon className="h-5! text-neutral-400 block" />
        </div>
      )}

      <Collapse
        in={selectedSite != null}
        orientation="vertical"
        timeout={300}
        unmountOnExit
      >
        <div
          className="relative bg-white flex flex-col z-10 transition-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200"
          style={{ height: `${height}px` }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-gray-300/50 z-[101] transition-colors"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          <Divider orientation="horizontal" />

          <div className="absolute z-[100] top-3 right-3">
            <Tooltip title="Закрыть">
              <IconButton
                sx={{
                  backgroundColor: "white",
                  color: "#1976d2",
                  "&:hover": { backgroundColor: "#f0f0f0" },
                  boxShadow: 1,
                }}
                size="small"
                onClick={() => setSelectedSite(null)}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </div>

          <div className="flex h-full flex-1 min-w-0 overflow-hidden">
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={value}
              onChange={handleChange}
              sx={{
                borderRight: 1,
                borderColor: "divider",
                minWidth: { xs: "56px", sm: "144px" },
              }}
              className="py-3"
            >
              <Tab
                label="Таблица"
                icon={<TableRowsIcon />}
                iconPosition="start"
                sx={{
                  minWidth: 0,
                  px: { xs: 1, sm: 2 },
                  "& .MuiTab-iconWrapper": { mr: { xs: 0, sm: 1 } },
                }}
              />
              <Tab
                label="Чарты"
                icon={<BarChartIcon />}
                iconPosition="start"
                sx={{
                  minWidth: 0,
                  px: { xs: 1, sm: 2 },
                  "& .MuiTab-iconWrapper": { mr: { xs: 0, sm: 1 } },
                }}
              />
            </Tabs>

            <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col p-4">
              {content}
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export default SiteInfo;
