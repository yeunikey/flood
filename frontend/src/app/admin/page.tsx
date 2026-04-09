"use client";

import View from "@/shared/ui/View";
import { Box, Tab, Tabs } from "@mui/material";
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
      className="flex flex-col gap-3 px-3 py-2 sm:px-4"
    >
      <Box sx={{ overflowX: "auto" }}>
        <Tabs
          value={0}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Пользователи" />
          <Tab label="Удаление данных" disabled />
        </Tabs>
      </Box>

      <UsersWidget />
    </View>
  );
}

export default AdminPage;
