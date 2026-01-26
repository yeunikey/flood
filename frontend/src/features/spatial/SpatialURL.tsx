import { Divider, Typography, IconButton, Tooltip } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";
import { useSpatialTiles } from "./model/useSpatialTiles";

function SpatialURL() {
  const { activeTileId } = useSpatialTiles();

  if (!activeTileId) return null;

  const url = `http://localhost:3001/v1/tiles/server/${activeTileId}/{z}/{x}/{y}.pbf`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована!");
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2 flex items-center gap-3">
        <PublicIcon color="action" />
        <div className="flex-1 overflow-hidden">
          <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 flex items-center">
            <Typography
              variant="body2"
              className="font-mono text-xs text-gray-700 truncate select-all"
              title={url}
            >
              {url}
            </Typography>
          </div>
        </div>
        <Tooltip title="Копировать ссылку">
          <IconButton onClick={handleCopy} size="small" className="ml-1">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <Divider orientation="horizontal" />
    </div>
  );
}

export default SpatialURL;
