import AnalyticItems from "@/features/analytic/AnalyticItems";
import { Typography } from "@mui/material";

function AnalyticNavigation() {
  return (
    <div className="flex flex-col h-full">
      <div className="pt-3 flex flex-col min-h-0">
        <Typography
          variant="overline"
          gutterBottom
          sx={{ display: "block" }}
          fontWeight={500}
          className="text-neutral-500 pl-3"
        >
          Список точек
        </Typography>

        <div className="flex-1 min-h-0 overflow-y-scroll">
          <AnalyticItems />
        </div>
      </div>
    </div>
  );
}

export default AnalyticNavigation;
