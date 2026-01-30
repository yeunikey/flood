import { useState } from "react";
import { Typography, IconButton, Tooltip } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import AnalyticTable from "@/features/analytic/AnalyticTable";
import {
  useAnalyticSites,
  AnalyticSite,
} from "@/features/analytic/model/useAnalyticSites";
import { Category } from "@/entities/category/types/categories";
import Variable from "@/entities/variable/types/variable";
import FullscreenTableModal from "@/features/analytic/modal/FullscreenInfoModal";

function TablesWidget() {
  const { activeSites } = useAnalyticSites();
  const categories = Object.entries(activeSites);

  const [fullscreenParams, setFullscreenParams] = useState<{
    site: AnalyticSite;
    category: Category;
    variables: Variable[];
  } | null>(null);

  const handleOpenFullscreen = (
    site: AnalyticSite,
    category: Category,
    variables: Variable[],
  ) => {
    setFullscreenParams({ site, category, variables });
  };

  const handleCloseFullscreen = () => {
    setFullscreenParams(null);
  };

  if (categories.length === 0) return null;

  return (
    <>
      <div className="p-3 pt-6 mb-24 space-y-12! w-full max-w-full">
        {categories.map(([catId, record]) => (
          <div key={catId} className="space-y-6!">
            <Typography variant="h5" fontWeight={500}>
              {record.category.name}
            </Typography>

            {record.sites.map((site) => (
              <div className="space-y-2! max-w-full" key={site.id}>
                <div className="flex items-center gap-6">
                  <Typography variant="h6" fontWeight={500}>
                    {site.name}
                  </Typography>

                  <Tooltip title="Открыть таблицу на весь экран">
                    <IconButton
                      onClick={() =>
                        handleOpenFullscreen(
                          site,
                          record.category,
                          record.variables,
                        )
                      }
                      size="small"
                      color="primary"
                    >
                      <OpenInFullIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>

                <AnalyticTable selectedSite={site} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <FullscreenTableModal
        open={!!fullscreenParams}
        onClose={handleCloseFullscreen}
        site={fullscreenParams?.site ?? null}
        category={fullscreenParams?.category ?? null}
        variables={fullscreenParams?.variables ?? []}
      />
    </>
  );
}

export default TablesWidget;
