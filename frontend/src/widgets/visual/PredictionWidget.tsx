import { Box, Divider } from "@mui/material";
import ToolsWidget from "./prediction/ToolsWidget";
import PredictionItems from "@/features/visual/prediction/PredictionItems";

function PredictionWidget() {
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
          test
        </Box>
      </Box>
    </Box>
  );
}

export default PredictionWidget;
