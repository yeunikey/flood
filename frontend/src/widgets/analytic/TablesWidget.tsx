import { useState, useEffect } from "react";
import {
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AnalyticTable from "@/features/analytic/AnalyticTable";
import {
  useAnalyticSites,
  AnalyticSite,
} from "@/features/analytic/model/useAnalyticSites";
import { Category } from "@/entities/category/types/categories";
import Variable from "@/entities/variable/types/variable";
import FullscreenTableModal from "@/features/analytic/modal/FullscreenInfoModal";
import { api } from "@/shared/model/api/instance";
import useAnalyticStore from "@/features/analytic/model/useAnalyticStore";
import { useAuth } from "@/shared/model/auth";
import DataSource from "@/entities/source/types/sources";
import { ApiResponse } from "@/types";

type SiteRowProps = {
  site: AnalyticSite;
  category: Category;
  variables: Variable[];
  onOpenFullscreen: (
    site: AnalyticSite,
    category: Category,
    variables: Variable[],
  ) => void;
  onExport: (site: AnalyticSite, category: Category) => void;
};

function SiteRow({
  site,
  category,
  variables,
  onOpenFullscreen,
  onExport,
}: SiteRowProps) {
  const { token } = useAuth();
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchSources = async () => {
      try {
        const { data } = await api.get<
          ApiResponse<{ variables: Variable[]; sources: DataSource[] }>
        >(`/data/category/${category.id}/variables`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { siteCode: site.code },
        });

        setAvailableSources(data.data.sources);

        if (data.data.sources.length > 0) {
          setSelectedSource(data.data.sources[0]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSources();
  }, [category.id, site.code, token]);

  const handleSourceChange = (event: SelectChangeEvent<number>) => {
    const sourceId = Number(event.target.value);
    const source = availableSources.find((s) => s.id === sourceId) || null;
    setSelectedSource(source);
  };

  return (
    <div className="space-y-2! max-w-full">
      <div className="flex items-center justify-between gap-6">
        <Typography variant="h6" fontWeight={500}>
          {site.name}
        </Typography>

        <div className="flex items-center gap-3">
          {availableSources.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Источник</InputLabel>
              <Select
                value={selectedSource?.id ?? ""}
                label="Источник"
                onChange={handleSourceChange}
              >
                {availableSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Tooltip title="Открыть таблицу на весь экран">
            <IconButton
              onClick={() => onOpenFullscreen(site, category, variables)}
              size="small"
            >
              <OpenInFullIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Экспортировать в формате .csv">
            <IconButton onClick={() => onExport(site, category)} size="small">
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <AnalyticTable
        selectedSite={site}
        selectedSourceId={selectedSource?.id}
      />
    </div>
  );
}

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
        { responseType: "blob" },
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
              <SiteRow
                key={site.id}
                site={site}
                category={record.category}
                variables={record.variables}
                onOpenFullscreen={handleOpenFullscreen}
                onExport={handleExportCsv}
              />
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
