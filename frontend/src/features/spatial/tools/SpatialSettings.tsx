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
import { vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";

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
