import { Paper, IconButton, Slider, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useHecrasStore } from "./model/useHecrasStore";

function HecrasPlayer() {
  const {
    times,
    currentTimeIndex,
    isPlaying,
    setIsPlaying,
    setCurrentTimeIndex,
  } = useHecrasStore();

  if (times.length === 0) return null;

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: 30,
        left: { xs: 12, sm: "50%" },
        right: { xs: 12, sm: "auto" },
        transform: { xs: "none", sm: "translateX(-50%)" },
        width: { xs: "auto", sm: "60%" },
        maxWidth: 600,
        p: { xs: 1.25, sm: 2 },
        display: "flex",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        alignItems: "center",
        gap: { xs: 1, sm: 2 },
        zIndex: 1000,
      }}
      className="rounded-2xl"
    >
      <IconButton onClick={() => setIsPlaying(!isPlaying)} color="primary">
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>

      <Slider
        min={0}
        max={times.length - 1}
        value={currentTimeIndex}
        onChange={(_, val) => {
          setIsPlaying(false);
          setCurrentTimeIndex(val as number);
        }}
        valueLabelDisplay="auto"
        valueLabelFormat={(index) => times[index]}
        sx={{
          flex: { xs: "1 0 100%", sm: 1 },
          order: { xs: 3, sm: 2 },
          minWidth: 0,
          px: { xs: 0.5, sm: 0 },
        }}
      />

      <Typography
        variant="body2"
        sx={{
          flex: { xs: 1, sm: "0 0 auto" },
          minWidth: { xs: 0, sm: 150 },
          order: { xs: 2, sm: 3 },
          textAlign: "right",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {times[currentTimeIndex]}
      </Typography>
    </Paper>
  );
}

export default HecrasPlayer;
