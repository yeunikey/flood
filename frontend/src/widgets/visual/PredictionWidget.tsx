import TuneIcon from "@mui/icons-material/Tune";
import { Box, Divider, Drawer, Fab, useMediaQuery, useTheme } from "@mui/material";
import ToolsWidget from "./prediction/ToolsWidget";
import PredictionItems from "@/features/visual/prediction/PredictionItems";
import ForecastWidget from "./prediction/ForecastWidget";
import { useState } from "react";

function PredictionWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
        <Drawer
          anchor="bottom"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{
            sx: {
              height: "70dvh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflowY: "auto",
            },
          }}
        >
          <Box sx={{ p: 1 }}>
            <PredictionItems />
          </Box>
        </Drawer>

        <Fab
          color="primary"
          size="medium"
          onClick={() => setMobileNavOpen(true)}
          sx={{ position: "absolute", right: 16, bottom: 72, zIndex: 1000 }}
        >
          <TuneIcon />
        </Fab>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <ToolsWidget />
            <Divider orientation="horizontal" />
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              overflowX: "hidden",
              width: "100%",
              p: 0,
              pb: "72px",
            }}
          >
            <ForecastWidget />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          width: 96 * 3.5,
          flexShrink: 0,
          overflowY: "auto",
          height: "100%",
        }}
      >
        <PredictionItems />
      </Box>

      <Divider orientation="vertical" flexItem />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <ToolsWidget />
          <Divider orientation="horizontal" />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
            p: 0,
          }}
        >
          <ForecastWidget />
        </Box>
      </Box>
    </Box>
  );
}

export default PredictionWidget;
