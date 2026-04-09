"use client";

import View from "@/shared/ui/View";
import MonitorMap from "@/features/monitor/MonitorMap";
import NavigationWidget from "@/widgets/monitor/NavigationWidget";
import { Divider, Drawer, Fab, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect, useState } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import SiteInfo from "@/features/monitor/SiteInfo";
import LayersIcon from "@mui/icons-material/Layers";

export default function Monitor() {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchLayers(token);
    fetchPools(token);
  }, [token]);

  return (
    <View links={["Панель", "Мониторинг"]} className="">
      {/* Mobile: layers panel in drawer */}
      {isMobile && (
        <>
          <Drawer
            anchor="bottom"
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            PaperProps={{
              sx: {
                height: "70dvh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              },
            }}
          >
            <NavigationWidget />
          </Drawer>

          {/* FAB to open layers drawer */}
          <Fab
            color="primary"
            size="medium"
            onClick={() => setMobileNavOpen(true)}
            sx={{
              position: "absolute",
              bottom: 72, // above bottom nav bar
              right: 16,
              zIndex: 1000,
            }}
          >
            <LayersIcon />
          </Fab>
        </>
      )}

      {isMobile ? (
        // Mobile: full-screen map
        <Grid container sx={{ height: "100%", position: "relative" }}>
          <Grid
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              minWidth: 0,
              position: "relative",
            }}
          >
            <MonitorMap />
            <SiteInfo />
          </Grid>
        </Grid>
      ) : (
        // Desktop: side panel + map
        <Grid container wrap="nowrap" sx={{ height: "100%" }}>
          <Grid
            sx={{
              width: 96 * 3.5,
              flexShrink: 0,
            }}
          >
            <NavigationWidget />
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
              position: "relative",
            }}
          >
            <MonitorMap />
            <SiteInfo />
          </Grid>
        </Grid>
      )}
    </View>
  );
}
