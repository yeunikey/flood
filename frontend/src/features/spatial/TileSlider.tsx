import { Slider, Typography } from "@mui/material";
import { useSpatialTiles } from "./model/useSpatialTiles";
import { useSpatial } from "@/entities/spatial/model/useSpatial";

export function TileSlider() {
  const { activeSpatial, activeTileId, setActiveTileId } = useSpatialTiles();
  const { spatials } = useSpatial();

  if (!activeSpatial || activeSpatial.tileIds.length <= 1) return null;

  const currentIndex = activeSpatial.tileIds.indexOf(activeTileId || "");

  const handleSliderChange = (_: unknown, value: number | number[]) => {
    const index = value as number;
    setActiveTileId(activeSpatial.tileIds[index]);
  };

  if (activeSpatial.tileIds.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 p-4 pb-2 bg-white z-10 rounded-t-2xl">
      <Typography variant="body1" className="mb-2 block text-center text-2xl">
        Таймлайн:{" "}
        <Typography component="span" color="primary" variant="inherit">
          {spatials
            .find((s) => s.spatial.id == activeSpatial.id)
            ?.tiles.find((t) => t.id == activeTileId)?.name || activeTileId}
        </Typography>
      </Typography>

      <Slider
        step={1}
        marks
        min={0}
        max={activeSpatial.tileIds.length - 1}
        value={currentIndex}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(index) =>
          spatials
            .find((s) => s.spatial.id == activeSpatial.id)
            ?.tiles.find((t) => t.id == activeSpatial.tileIds[index])?.name ||
          ""
        }
      />
    </div>
  );
}
