import {
  Card,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { ForecastDataPoint } from "../../model/forecast.types";

export default function ForecastTable({ data }: { data: ForecastDataPoint[] }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer component={Paper} elevation={0} sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 420 }}>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>Дата</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                Predicted
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                Observed
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.date} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ color: "text.secondary" }}>
                  {row.date}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {row.predicted.toFixed(1)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "grey.400" }}>
                  {row.observed ? row.observed.toFixed(1) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
