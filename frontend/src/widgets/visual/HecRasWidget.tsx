import HecrasItems from "@/features/visual/hecras/HecrasItems";
import HecrasMap from "@/features/visual/hecras/HecrasMap";
import HecrasPlayer from "@/features/visual/hecras/HecrasPlayer";
import HecrasVisual from "@/features/visual/hecras/map/HecrasVisual";
import { Divider, Grid } from "@mui/material";

function HecRasWidget() {
  return (
    <div className="flex h-full">
      <HecrasItems />

      <Divider orientation="vertical" />

      <Grid size={"grow"} className="grow flex flex-col flex-1 relative">
        <HecrasMap />
        <HecrasVisual />
        <HecrasPlayer />
      </Grid>
    </div>
  );
}

export default HecRasWidget;
