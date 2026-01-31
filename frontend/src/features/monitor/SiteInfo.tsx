import {
  Collapse,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
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

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000]">
      {selectedSite && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-gray-200 border-[1px] bg-white rounded-full p-0.5 cursor-row-resize z-[101] select-none shadow-sm"
          onMouseDown={handleMouseDown}
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
              sx={{ borderRight: 1, borderColor: "divider", minWidth: "144px" }}
              className="py-3"
            >
              <Tab
                label="Таблица"
                icon={<TableRowsIcon />}
                iconPosition="start"
              />
              <Tab label="Чарты" icon={<BarChartIcon />} iconPosition="start" />
            </Tabs>

            <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col p-4">
              {value === 0 ? <TableInfo /> : <ChartInfo />}
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export default SiteInfo;
