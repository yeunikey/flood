import { Typography } from "@mui/material";
import AnalyticTable from "@/features/analytic/AnalyticTable";
import { useAnalyticSites } from "@/features/analytic/model/useAnalyticSites";

function TablesWidget() {
  const { activeSites } = useAnalyticSites();
  const categories = Object.entries(activeSites);

  if (categories.length === 0) return null;

  return (
    <div className="mt-12 mb-24 px-3 space-y-12!">
      {categories.map(([category, record]) => (
        <div key={category} className="space-y-3!">
          <Typography variant="h5" fontWeight={500}>
            {record.category.name}
          </Typography>

          {record.sites.map((site, i) => (
            <div className="space-y-2!" key={i}>
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
