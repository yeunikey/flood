import { Box, Card, CardContent, Typography } from "@mui/material";
import { ForecastDataPoint } from "../../model/forecast.types";

export default function ForecastSummary({ data }: { data: ForecastDataPoint[] }) {
  const peak = data.reduce<ForecastDataPoint | null>((max, point) => {
    if (!max || point.predicted > max.predicted) return point;
    return max;
  }, null);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold", mb: 1 }}>
          Сводка по прогнозу
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Ед.изм: м³/с
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
          gap={2}
          mt={2}
        >
          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2, border: 1, borderColor: "grey.200" }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Пик (max predicted)
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: "bold" }}>
              {peak ? `${peak.predicted.toFixed(1)} м³/с` : "Нет данных"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              дата: {peak?.date || "-"}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2, border: 1, borderColor: "grey.200" }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Относительно квантилей
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              ниже Q95
            </Typography>
            <Typography variant="caption" color="text.secondary">
              превышений нет
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
