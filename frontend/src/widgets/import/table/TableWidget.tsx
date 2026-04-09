import { Box, Divider, Drawer, Fab, useMediaQuery, useTheme } from "@mui/material";
import CategoryList from "@/widgets/import/table/categories_list/CategoryList";
import { useImportStore } from "@/features/import/model/useImportStore";
import CreateVariableModal from "@/features/import/ui/modal/CreateVariableModal";
import ProgressModal from "@/features/import/ui/modal/ProgressModal";
import { stepperPages } from "@/features/import/model/pages";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { useState } from "react";

export default function TableWidget() {
  const { stepperLevel } = useImportStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex h-full flex-1 overflow-hidden">
      <CreateVariableModal />
      <ProgressModal />

      {isMobile ? (
        <>
          <Drawer
            anchor="bottom"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            PaperProps={{
              sx: {
                height: "70dvh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              },
            }}
          >
            <Box sx={{ py: 2 }}>
              <CategoryList />
            </Box>
          </Drawer>

          <Fab
            color="primary"
            size="medium"
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              position: "absolute",
              right: 16,
              bottom: 72,
              zIndex: 1000,
            }}
          >
            <FormatListBulletedIcon />
          </Fab>
        </>
      ) : (
        <>
          <div className="w-96 flex-shrink-0 py-6">
            <CategoryList />
          </div>

          <Divider orientation="vertical" flexItem />
        </>
      )}

      <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-auto">
        {stepperPages[stepperLevel]}
      </div>
    </div>
  );
}
