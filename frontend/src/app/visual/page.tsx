"use client";

import { fetchHecRas } from "@/entities/hec-ras/api/fetchHecRas";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import { useAuth } from "@/shared/model/auth";
import View from "@/shared/ui/View";
import CalculationWidget from "@/widgets/visual/CalculationWidget";
import HecRasWidget from "@/widgets/visual/HecRasWidget";
import PredictionWidget from "@/widgets/visual/PredictionWidget";
import { Divider, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";

function SpatialPage() {
  const [currentPage, setPage] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setPage(newValue);
  };

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    fetchHecRas(token);
    fetchPools(token);
    fetchLayers(token);
  }, [token]);

  return (
    <View links={["Паводки", "Прогнозы и сценарии"]}>
      <div className="flex flex-col h-full">
        <div className="px-2 pt-2 sm:px-3">
          <Tabs
            value={currentPage}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: { xs: 40, sm: 48 },
              "& .MuiTab-root": {
                minHeight: { xs: 40, sm: 48 },
                minWidth: { xs: "auto", sm: 160 },
                px: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                whiteSpace: "nowrap",
              },
            }}
          >
            <Tab label="Сценарии HEC-RAS" />
            <Tab label="Прогнозы моделей" />
            <Tab label="Расчёты Q1" />
          </Tabs>
        </div>

        <Divider orientation="horizontal" />

        <div className="flex-1 min-h-0 relative overflow-hidden">
          {currentPage == 0 && <HecRasWidget />}
          {currentPage == 1 && <PredictionWidget />}
          {currentPage == 2 && <CalculationWidget />}
        </div>
      </div>
    </View>
  );
}

export default SpatialPage;
