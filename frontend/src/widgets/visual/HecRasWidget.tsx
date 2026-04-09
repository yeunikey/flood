"use client";

import HecrasItems from "@/features/visual/hecras/HecrasItems";
import HecrasMap from "@/features/visual/hecras/HecrasMap";
import HecrasPlayer from "@/features/visual/hecras/HecrasPlayer";
import HecrasVisual from "@/features/visual/hecras/map/HecrasVisual";
import { Divider, Drawer, Fab, useMediaQuery, useTheme } from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { useState } from "react";

function HecRasWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileListOpen, setMobileListOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex h-full flex-col relative">
        <Drawer
          anchor="bottom"
          open={mobileListOpen}
          onClose={() => setMobileListOpen(false)}
          PaperProps={{
            sx: {
              height: "65dvh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: "hidden",
            },
          }}
        >
          <HecrasItems />
        </Drawer>

        <Fab
          color="primary"
          size="medium"
          onClick={() => setMobileListOpen(true)}
          sx={{ position: "absolute", bottom: 72, right: 16, zIndex: 1000 }}
        >
          <FormatListBulletedIcon />
        </Fab>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          <HecrasMap />
          <HecrasVisual />
          <HecrasPlayer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-80 flex-shrink-0 h-full overflow-hidden">
        <HecrasItems />
      </div>

      <Divider orientation="vertical" />

      <div className="grow flex flex-col flex-1 relative">
        <HecrasMap />
        <HecrasVisual />
        <HecrasPlayer />
      </div>
    </div>
  );
}

export default HecRasWidget;
