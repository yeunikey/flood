"use client";

import View from "@/shared/ui/View";
import { Box, Divider, Drawer, Fab, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect, useState } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import AnalyticNavigation from "@/widgets/analytic/AnalyticNavigation";
import ToolsWidget from "@/widgets/analytic/ToolsWidget";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import TablesWidget from "@/widgets/analytic/TablesWidget";
import VariablesSettingsModal from "@/features/analytic/modal/VariablesSettingsModal";
import ChartWidget from "@/widgets/analytic/ChartWidget";
import DependencyWidget from "@/widgets/analytic/DependencyWidget";
import TuneIcon from "@mui/icons-material/Tune";

export default function Analytic() {
  const { token } = useAuth();
  const { showDependencies, viewMode, variableCollapse, setVariableCollapse } =
    useAnalyticStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetchLayers(token);
    fetchPools(token);
  }, [token]);

  return (
    <View links={["Панель", "Аналитика"]} className="">
      <VariablesSettingsModal
        open={variableCollapse}
        onClose={() => setVariableCollapse(!variableCollapse)}
      />

      {/* Mobile: navigation in bottom drawer */}
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
                overflowY: "auto",
              },
            }}
          >
            <Box sx={{ p: 1 }}>
              <AnalyticNavigation />
            </Box>
          </Drawer>

          <Fab
            color="primary"
            size="medium"
            onClick={() => setMobileNavOpen(true)}
            sx={{
              position: "fixed",
              bottom: 72,
              right: 16,
              zIndex: 1000,
            }}
          >
            <TuneIcon />
          </Fab>
        </>
      )}

      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
        {/* Desktop: side navigation panel */}
        {!isMobile && (
          <>
            <Box
              sx={{
                width: 96 * 3.5,
                flexShrink: 0,
                overflowY: "auto",
                height: "100%",
              }}
            >
              <AnalyticNavigation />
            </Box>

            <Divider orientation="vertical" flexItem />
          </>
        )}

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
              height: "100%",
              p: 0,
              // Extra bottom padding on mobile to avoid FAB overlap
              pb: isMobile ? "72px" : 0,
            }}
          >
            {showDependencies ? (
              <DependencyWidget />
            ) : (
              <>
                {viewMode === "table" ? (
                  <Box sx={{ maxWidth: "100%", width: "100%", height: "100%" }}>
                    <TablesWidget />
                  </Box>
                ) : (
                  <Box
                    p={{ xs: 2, sm: 4 }}
                    display="flex"
                    justifyContent="center"
                    sx={{ overflowX: "auto" }}
                  >
                    <ChartWidget />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </View>
  );
}
