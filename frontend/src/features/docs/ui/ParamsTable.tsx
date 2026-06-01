import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import type { ParamRow } from "../model/types";

export function ParamsTable({ rows }: { rows: ParamRow[] }) {
  return (
    <Table size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
      <TableHead>
        <TableRow>
          <TableCell>name</TableCell>
          <TableCell>type</TableCell>
          <TableCell>required</TableCell>
          <TableCell>description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[0]}>
            <TableCell sx={{ fontFamily: "monospace" }}>{row[0]}</TableCell>
            <TableCell>{row[1]}</TableCell>
            <TableCell>{row[2]}</TableCell>
            <TableCell>{row[3]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
