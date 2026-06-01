import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { viewerEndpoints } from "../model/docs.constants";

export function ViewerPathsTable() {
  return (
    <Stack spacing={4}>
      <Typography variant="h3" fontWeight={500}>
        Все GET пути viewer
      </Typography>
      <Typography color="text.secondary">
        Ниже перечислены пути на получение информации. API ключ передается через
        X-API-Key или query apiKey. Пути создания, удаления, импорта и
        обновления не входят в права viewer.
      </Typography>
      <Table size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
        <TableHead>
          <TableRow>
            <TableCell>method</TableCell>
            <TableCell>path</TableCell>
            <TableCell>response</TableCell>
            <TableCell>description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {viewerEndpoints.map((row) => (
            <TableRow key={row[1]}>
              <TableCell>{row[0]}</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>{row[1]}</TableCell>
              <TableCell>{row[2]}</TableCell>
              <TableCell>{row[3]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
