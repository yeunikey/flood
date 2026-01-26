import SpatialItems from "@/features/spatial/SpatialItems";
import SpatialMap from "@/widgets/import/spatial/SpatialMap";
import { Divider, Grid } from "@mui/material";

function ViewWidget() {
  return (
    <div className="flex h-full">
      <SpatialItems />

      <Divider orientation="vertical" />

      <Grid size={"grow"} className="grow flex flex-col flex-1">
        <SpatialMap />
      </Grid>
    </div>
  );
}

export default ViewWidget;
