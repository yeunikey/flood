import { Typography } from "@mui/material";
import AnalyticTable from "@/features/analytic/AnalyticTable";
import { useAnalyticSites } from "@/features/analytic/model/useAnalyticSites";

function TablesWidget() {
  const { activeSites } = useAnalyticSites();
  const categories = Object.entries(activeSites);

  if (categories.length === 0) return null;

  return (
    <div className="p-3 pt-6 mb-24 space-y-12! w-full max-w-full">
      {categories.map(([category, record]) => (
        <div key={category} className="space-y-6!">
          <Typography variant="h5" fontWeight={500}>
            {record.category.name}
          </Typography>

          {record.sites.map((site, i) => (
            <div className="space-y-2! max-w-full" key={i}>
              <Typography variant="h6" fontWeight={500}>
                {site.name}
              </Typography>
              <AnalyticTable selectedSite={site} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TablesWidget;
