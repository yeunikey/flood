"use client";

import View from "@/shared/ui/View";
import { Tab, Tabs } from "@mui/material";
import { useAuth } from "@/shared/model/auth";
import UsersWidget from "@/widgets/admin/UsersWidgets";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (!["admin"].includes(user?.role || "")) {
      router.push("/");
    }
  }, [user]);

  if (!["admin"].includes(user?.role || "")) {
    return null;
  }

  return (
    <View
      links={["Паводки", "Администрирование"]}
      className="px-3 py-2 flex flex-col gap-3"
    >
      <Tabs value={0}>
        <Tab label="Пользователи" />
        <Tab label="Удаление данных" disabled />
      </Tabs>

      <UsersWidget />
    </View>
  );
}

export default AdminPage;
