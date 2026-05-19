"use client";

import View from "@/shared/ui/View";
import StatisticsWidget from "@/widgets/statistics/StatisticsWidget";

export default function StatisticsPage() {
  return (
    <View
      links={["Панель", "Статистика"]}
      className="flex flex-col overflow-y-auto bg-slate-50"
    >
      <StatisticsWidget />
    </View>
  );
}
