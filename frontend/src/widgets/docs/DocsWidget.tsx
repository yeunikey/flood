"use client";

import { docs } from "@/features/docs";
import View from "@/shared/ui/View";
import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { DocsContent } from "./DocsContent";
import { DocsSidebar } from "./DocsSidebar";
import { DocsToc } from "./DocsToc";

export default function DocsWidget() {
  const [activeDoc, setActiveDoc] = useState(docs[1].id);
  const doc = useMemo(
    () => docs.find((item) => item.id === activeDoc) ?? docs[0],
    [activeDoc],
  );

  const openDoc = (id: string) => {
    setActiveDoc(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <View>
      <Box
        sx={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          overflow: "hidden",
        }}
      >
        <DocsSidebar docs={docs} activeDoc={activeDoc} onOpenDoc={openDoc} />

        <Box sx={{ overflow: "auto" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 980px) 220px" },
              gap: 7,
              px: { xs: 2, md: 6 },
              py: 5,
            }}
          >
            <DocsContent activeDoc={activeDoc} doc={doc} />
            <DocsToc activeDoc={activeDoc} anchors={doc.anchors} />
          </Box>
        </Box>
      </Box>
    </View>
  );
}
