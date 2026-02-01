"use client";

import HecRasProjects from "@/features/visual/hecras/HecRasProjects";
import View from "@/shared/ui/View";

function VisualPage() {
  return (
    <View links={["Паводки", "Прогнозы и сценарии"]}>
      <HecRasProjects />
    </View>
  );
}

export default VisualPage;
