"use client";

import View from "@/shared/ui/View";
import { Tab, Tabs } from "@mui/material";
import PoolsWidget from "@/widgets/pools/PoolsWidget";
import { useAuth } from "@/shared/model/auth";
import { useEffect } from "react";
import { fetchSites } from "@/entities/site/api/fetchSites";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import { fetchSpatials } from "@/entities/spatial/api/fetchSpatials";

function AdminPage() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    fetchSites(token);
    fetchPools(token);
    fetchSpatials(token);
  }, [token]);

  return (
    <View
      links={["Паводки", "Администрирование"]}
      className="px-3 py-2 flex flex-col gap-3"
    >
      <Tabs value={0}>
        <Tab label="Бассейны" />
        <Tab label="Пользователи" disabled />
        <Tab label="Удаление данных" disabled />
      </Tabs>

      <PoolsWidget />
    </View>
  );
}

export default AdminPage;
