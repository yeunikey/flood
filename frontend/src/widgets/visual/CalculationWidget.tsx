import CalculationItems from "@/features/visual/calculation/CalculationItems";
import CalculationMap from "@/features/visual/calculation/CalculationMap";
import { Divider, Grid } from "@mui/material";

function CalculationWidget() {
  return (
    <div className="flex h-full">
      <CalculationItems />

      <Divider orientation="vertical" />

      <Grid size={"grow"} className="grow flex flex-col flex-1 relative">
        <CalculationMap />
      </Grid>
    </div>
  );
}

export default CalculationWidget;
