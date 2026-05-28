"use client";

import { useAuth } from "@/shared/model/auth";
import View from "@/shared/ui/View";
import StatisticsWidget from "@/widgets/statistics/StatisticsWidget";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StatisticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [router, user]);

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <View
      links={["Панель", "Статистика"]}
      className="flex flex-col overflow-y-auto bg-slate-50"
    >
      <StatisticsWidget />
    </View>
  );
}
