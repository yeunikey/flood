"use client";

import { fetchHecRas } from "@/entities/hec-ras/api/fetchHecRas";
import { fetchLayers } from "@/entities/layer/api/fetchLayers";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import { useAuth } from "@/shared/model/auth";
import View from "@/shared/ui/View";
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
        <div className="py-2 pb-0 px-3">
          <Tabs value={currentPage} onChange={handleChange}>
            <Tab label="Сценарии HEC-RAS" />
            <Tab label="Прогнозы моделей" />
          </Tabs>
        </div>

        <Divider orientation="horizontal" />

        <div className="flex-1 min-h-0 relative">
          {currentPage == 0 && <HecRasWidget />}
          {currentPage == 1 && <PredictionWidget />}
        </div>
      </div>
    </View>
  );
}

export default SpatialPage;
