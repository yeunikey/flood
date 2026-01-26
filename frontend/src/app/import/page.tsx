"use client";

import View from "@/shared/ui/View";
import SpatialWidget from "@/widgets/import/spatial/SpatialWidget";
import TableWidget from "@/widgets/import/table/TableWidget";
import { Divider, Tab, Tabs } from "@mui/material";
import { useState } from "react";

export default function ImportPage() {
  const [currentPage, setPage] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setPage(newValue);
  };

  return (
    <View
      links={["Паводки", "Импорт данных"]}
      className="flex flex-col"
    >
      <div className="flex flex-col h-full w-full">
        <div className="py-2 pb-0 px-3 flex-shrink-0">
          <Tabs value={currentPage} onChange={handleChange}>
            <Tab label="Табличные данные" />
            <Tab label="Пространственные данные" />
          </Tabs>
        </div>

        <Divider orientation="horizontal" />

        <div className="flex-1 min-h-0">
          {currentPage == 0 && <TableWidget />}
          {currentPage == 1 && <SpatialWidget />}
        </div>
      </div>
    </View>
  );
}
