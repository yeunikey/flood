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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { api } from "@/shared/model/api/instance";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
function TablesWidget() {
  const { activeSites } = useAnalyticSites();
  const { fromDate, toDate } = useAnalyticStore();
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

  const handleExportCsv = async (site: AnalyticSite, category: Category) => {
    try {
      const response = await api.post(
        `data/category/${category.id}/export/csv`,
        {
          siteCode: site.code,
          startDate: fromDate,
          endDate: toDate,
        },
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${site.code}_${category.name}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
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

                  <div className="flex gap-3">
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
                      >
                        <OpenInFullIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Экспортировать в формате .csv">
                      <IconButton
                        onClick={() => handleExportCsv(site, record.category)}
                        size="small"
                      >
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
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
