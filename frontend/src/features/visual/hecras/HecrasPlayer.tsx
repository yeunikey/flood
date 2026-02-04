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
        left: "50%",
        transform: "translateX(-50%)",
        width: "60%",
        maxWidth: 600,
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        zIndex: 1000,
      }}
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
        sx={{ flex: 1 }}
      />

      <Typography
        variant="body2"
        sx={{ minWidth: 150, textAlign: "right", whiteSpace: "nowrap" }}
      >
        {times[currentTimeIndex]}
      </Typography>
    </Paper>
  );
}

export default HecrasPlayer;
