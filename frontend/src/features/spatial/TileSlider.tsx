import { useMemo } from "react";
import { Slider, Typography } from "@mui/material";
import { useSpatialTiles } from "./model/useSpatialTiles";
import { useSpatial } from "@/entities/spatial/model/useSpatial";

export function TileSlider() {
  const { activeSpatial, activeTileId, setActiveTileId } = useSpatialTiles();
  const { spatials } = useSpatial();

  const sortedTiles = useMemo(() => {
    if (!activeSpatial) return [];

    const currentSpatialComposite = spatials.find(
      (s) => s.spatial.id === activeSpatial.id,
    );

    if (!currentSpatialComposite) return [];

    const tiles = activeSpatial.tileIds.map((id) => {
      const tileObj = currentSpatialComposite.tiles.find((t) => t.id === id);
      return {
        id,
        name: tileObj?.name || id,
      };
    });

    return tiles.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [activeSpatial, spatials]);

  if (!activeSpatial || sortedTiles.length <= 1) return null;

  const currentIndex = sortedTiles.findIndex((t) => t.id === activeTileId);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const handleSliderChange = (_: unknown, value: number | number[]) => {
    const index = value as number;
    setActiveTileId(sortedTiles[index].id);
  };

  const currentTileName = sortedTiles[safeIndex]?.name || activeTileId;

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 p-4 pb-2 bg-white z-10 rounded-t-2xl shadow-lg">
      <Typography
        variant="body1"
        className="mb-2 block text-center text-xl font-medium"
      >
        Таймлайн:{" "}
        <Typography
          component="span"
          color="primary"
          variant="inherit"
          fontWeight="bold"
        >
          {currentTileName}
        </Typography>
      </Typography>

      <Slider
        step={1}
        marks
        min={0}
        max={sortedTiles.length - 1}
        value={safeIndex}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(index) => sortedTiles[index]?.name || ""}
      />
    </div>
  );
}
