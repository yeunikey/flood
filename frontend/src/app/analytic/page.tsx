"use client";

import View from "@/shared/ui/View";
import { Box, Divider, Typography } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import { useEffect } from "react";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import AnalyticNavigation from "@/widgets/analytic/AnalyticNavigation";
import ToolsWidget from "@/widgets/analytic/ToolsWidget";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import TablesWidget from "@/widgets/analytic/TablesWidget";
import VariablesSettingsModal from "@/features/analytic/modal/VariablesSettingsModal";
import ChartWidget from "@/widgets/analytic/ChartWidget";

export default function Analytic() {
  const { token } = useAuth();
  const { showDependencies, viewMode, variableCollapse, setVariableCollapse } =
    useAnalyticStore();

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

      <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
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
            {showDependencies ? (
              <div className="test">test</div>
            ) : (
              <>
                {viewMode === "table" ? (
                  <Box sx={{ maxWidth: "100%", width: "100%" }}>
                    <TablesWidget />
                  </Box>
                ) : (
                  <Box p={4} display="flex" justifyContent="center">
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
