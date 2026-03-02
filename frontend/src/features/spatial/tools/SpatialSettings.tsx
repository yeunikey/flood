import {
  Typography,
  Switch,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useSpatialSettings } from "../model/useSpatialSettings";
import { useSpatialTiles } from "../model/useSpatialTiles";
import { baseUrl, vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";

export const SpatialSettings = () => {
  const { tooltipEnabled, toggleTooltip } = useSpatialSettings();
  const { activeSpatial, activeTileId } = useSpatialTiles();
  const { token } = useAuth();

  const handleDownload = async () => {
    if (!activeTileId) return;

    try {
      const response = await vapi.get(`tiles/${activeTileId}/geojson`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const headers = response.headers as unknown as Record<
        string,
        string | undefined
      >;
      const contentDisposition = headers["content-disposition"];

      let fileName = `${activeTileId}.geojson`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = decodeURIComponent(fileNameMatch[1]);
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download GeoJSON", error);
    }
  };

  const url = `${baseUrl}/tiles/server/${activeTileId}/{z}/{x}/{y}.pbf`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована!");
  };

  if (!activeSpatial) return null;

  return (
    <div className="bg-white p-2 rounded-2xl mt-2 min-w-[220px]">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          {tooltipEnabled ? (
            <VisibilityIcon fontSize="small" className="text-gray-500" />
          ) : (
            <VisibilityOffIcon fontSize="small" className="text-gray-400" />
          )}
          <Typography variant="caption" className="font-medium text-gray-700">
            Атрибуты
          </Typography>
        </div>
        <Switch
          size="small"
          checked={tooltipEnabled}
          onChange={toggleTooltip}
          color="primary"
        />
      </div>

      <div className="py-3">
        <Divider className="opacity-60" />
      </div>

      <div
        className="flex items-center justify-between px-2 cursor-pointer hover:bg-gray-50 rounded-e transition-colors group"
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

      <div
        className="flex items-center justify-between px-2 cursor-pointer hover:bg-gray-50 rounded-e transition-colors group"
        onClick={handleCopy}
      >
        <Typography
          variant="caption"
          className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors"
        >
          Ссылка на TileServer
        </Typography>
        <Tooltip title="Скопировать">
          <IconButton size="small" className="p-1">
            <ContentCopyIcon
              fontSize="small"
              className="text-gray-500 group-hover:text-blue-600"
            />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};
