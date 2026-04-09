import SpatialItems from "@/features/spatial/SpatialItems";
import SpatialMap from "@/widgets/import/spatial/SpatialMap";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { Box, Divider, Drawer, Fab, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

function ViewWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileListOpen, setMobileListOpen] = useState(false);

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", height: "100%", flexDirection: "column", position: "relative" }}>
        <Drawer
          anchor="bottom"
          open={mobileListOpen}
          onClose={() => setMobileListOpen(false)}
          PaperProps={{
            sx: {
              height: "70dvh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: "hidden",
            },
          }}
        >
          <SpatialItems mobile />
        </Drawer>

        <Fab
          color="primary"
          size="medium"
          onClick={() => setMobileListOpen(true)}
          sx={{ position: "absolute", right: 16, bottom: 72, zIndex: 1000 }}
        >
          <FormatListBulletedIcon />
        </Fab>

        <Grid size={"grow"} className="grow flex flex-col flex-1 min-w-0">
          <SpatialMap />
        </Grid>
      </Box>
    );
  }

  return (
    <div className="flex h-full">
      <SpatialItems />

      <Divider orientation="vertical" />

      <Grid size={"grow"} className="grow flex flex-col flex-1 min-w-0">
        <SpatialMap />
      </Grid>
    </div>
  );
}

export default ViewWidget;
