import { formatStatisticNumber } from "@/features/statistics/model/format";
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: number;
  icon: ReactNode;
}

export default function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        minHeight: { xs: 92, sm: 112 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Typography color="text.secondary" fontSize={14}>
          {label}
        </Typography>
        <Box sx={{ color: "primary.main", lineHeight: 0 }}>{icon}</Box>
      </Box>

      <Typography
        variant="h4"
        fontWeight={600}
        sx={{ fontSize: { xs: 26, sm: 32 }, overflowWrap: "anywhere" }}
      >
        {formatStatisticNumber(value)}
      </Typography>
    </Paper>
  );
}
