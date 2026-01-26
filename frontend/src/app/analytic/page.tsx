"use client";

import View from "@/shared/ui/View";
import NavigationWidget from "@/widgets/monitor/NavigationWidget";
import { Divider, Grid } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import AnalyticNavigation from "@/widgets/analytic/AnalyticNavigation";

export default function Analytic() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    fetchLayers(token);
    fetchPools(token);
  }, [token]);

  return (
    <View links={["Панель", "Аналитика"]} className="">
      <Grid container wrap="nowrap" sx={{ height: "100%" }}>
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
          analytic widget
        </Grid>
      </Grid>
    </View>
  );
}
