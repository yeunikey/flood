"use client";

import View from "@/shared/ui/View";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import AnalyticNavigation from "@/widgets/analytic/AnalyticNavigation";
import ToolsWidget from "@/widgets/analytic/ToolsWidget";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import TablesWidget from "@/widgets/analytic/TablesWidget";

export default function Analytic() {
  const { token } = useAuth();
  const { viewMode } = useAnalyticStore();

  useEffect(() => {
    if (!token) return;
    fetchLayers(token);
    fetchPools(token);
  }, [token]);

  return (
    <View links={["Панель", "Аналитика"]} className="">
      <Grid container wrap="nowrap" sx={{ minHeight: "100%" }}>
        <Grid
          sx={{
            width: 96 * 3.5,
            flexShrink: 0,
          }}
        >
          <AnalyticNavigation />
        </Grid>

        <Divider orientation="vertical" flexItem />

        <Grid
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <ToolsWidget />

          {viewMode === "table" ? (
            <TablesWidget />
          ) : (
            <Box p={4} display="flex" justifyContent="center">
              <Typography color="textSecondary">
                График (Placeholder)
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </View>
  );
}
