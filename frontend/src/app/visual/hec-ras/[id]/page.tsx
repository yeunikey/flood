"use client";

import HecRasViewer from "@/features/visual/hecras/HecRasViewer";
import View from "@/shared/ui/View";

function HecRasView() {
  return (
    <View links={["Паводки", "Просмотр"]}>
      <HecRasViewer />
    </View>
  );
}

export default HecRasView;
