"use client";

import View from "@/shared/ui/View";
import SpatialWidget from "@/widgets/import/spatial/SpatialWidget";
import TableWidget from "@/widgets/import/table/TableWidget";
import PoolsWidget from "@/widgets/import/pools/PoolsWidget";
import { Divider, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "@/shared/model/auth";
import { fetchPools } from "@/entities/pool/api/fetchPools";
import { fetchSites } from "@/entities/site/api/fetchSites";
import { fetchSpatials } from "@/entities/spatial/api/fetchSpatials";
import { useRouter } from "next/dist/client/components/navigation";

export default function ImportPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (!["admin", "editor"].includes(user?.role || "")) {
      router.push("/");
    }
  }, [user]);

  const [currentPage, setPage] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setPage(newValue);
  };

  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    fetchSites(token);
    fetchPools(token);
    fetchSpatials(token);
  }, [token]);

  console.log(user?.role);

  if (!["admin", "editor"].includes(user?.role || "")) {
    return null;
  }

  return (
    <View links={["Паводки", "Импорт данных"]} className="flex flex-col">
      <div className="flex flex-col h-full w-full">
        <div className="py-2 pb-0 px-3 flex-shrink-0">
          <Tabs value={currentPage} onChange={handleChange}>
            <Tab label="Табличные данные" />
            <Tab label="Пространственные данные" />
            <Tab label="Бассейны и категории" />
          </Tabs>
        </div>

        <Divider orientation="horizontal" />

        <div className="flex-1 min-h-0">
          {currentPage == 0 && <TableWidget />}
          {currentPage == 1 && <SpatialWidget />}
          {currentPage == 2 && <PoolsWidget />}
        </div>
      </div>
    </View>
  );
}
