'use client'

import View from "@/shared/ui/View";
import MonitorMap from "@/features/monitor/MonitorMap";
import NavigationWidget from "@/widgets/monitor/NavigationWidget";
import { Divider, Grid } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";

export default function Monitor() {

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    fetchLayers(token);
    fetchPools(token);

  }, [token])

  return (
    <View links={["Панель", "Мониторинг"]} className="">
      <Grid
        container
        wrap="nowrap"
        sx={{ height: '100%' }}
      >
        <Grid
          sx={{ width: 96 * 3.5 }}
        >
          <NavigationWidget />
        </Grid>

        <Divider orientation="vertical" flexItem />

        <Grid sx={{ flexGrow: 1 }}>
          <MonitorMap />
        </Grid>
      </Grid>
    </View>
  );
}
