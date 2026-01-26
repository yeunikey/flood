import {
    Typography,
    Switch,
    IconButton,
    Tooltip,
    Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useSpatialSettings } from "../model/useSpatialSettings";
import { useSpatialTiles } from "../model/useSpatialTiles";

export const SpatialSettings = () => {
  const { tooltipEnabled, toggleTooltip } = useSpatialSettings();
  const { activeSpatial } = useSpatialTiles();

  const handleDownload = () => {
    if (!activeSpatial) return;

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(activeSpatial, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${activeSpatial.name || "spatial_data"}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!activeSpatial) return null;

  return (
    <div className="bg-white p-2 rounded-e-2xl mt-2 min-w-[220px]">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          {tooltipEnabled ? (
            <VisibilityIcon fontSize="small" className="text-gray-500" />
          ) : (
            <VisibilityOffIcon fontSize="small" className="text-gray-400" />
          )}
          <Typography variant="caption" className="font-medium text-gray-700">
            Подсказки
          </Typography>
        </div>
        <Switch
          size="small"
          checked={tooltipEnabled}
          onChange={toggleTooltip}
          color="primary"
        />
      </div>

      <Divider className="my-1 opacity-60" />

      <div
        className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-e transition-colors group"
        onClick={handleDownload}
      >
        <Typography
          variant="caption"
          className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors"
        >
          Скачать JSON
        </Typography>
        <Tooltip title="Скачать конфигурацию">
          <IconButton size="small" className="p-1">
            <DownloadIcon
              fontSize="small"
              className="text-gray-500 group-hover:text-blue-600"
            />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};
