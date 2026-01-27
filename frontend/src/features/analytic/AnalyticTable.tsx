import Variable from "@/entities/variable/types/variable";
import Site from "@/entities/site/types/site";
import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  LinearProgress,
} from "@mui/material";
import { useMemo } from "react";
import { useDisabledVariables } from "../monitor/model/useDisabledVariables";
import useAnalyticStore from "./model/useAnalyticStore";
import { useAnalyticSites } from "./model/useAnalyticSites";

type TableProps = {
  selectedSite: Site;
};

function AnalyticTable({ selectedSite }: TableProps) {
  const { disabledVariables } = useDisabledVariables();
  const { page, rowsPerPage, setPage, setRowsPerPage } = useAnalyticStore();
  const { activeSites } = useAnalyticSites();

  const siteState = Object.values(activeSites)
    .flatMap((r) => r.sites)
    .find((s) => s.id === selectedSite.id);

  const loading = siteState?.loading ?? false;
  const infoData = siteState?.result?.content ?? [];
  const totalRows = siteState?.result?.total ?? 0;

  const infoVariables = useMemo(() => {
    if (infoData.length > 0) {
      return infoData[0].values.map((v) => v.variable);
    }
    return [];
  }, [infoData]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxShadow: "none",
        position: "relative",
      }}
      className="border border-gray-200 rounded-lg! h-96"
    >
      {loading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        />
      )}

      <TableContainer
        sx={{
          flex: 1,
          width: "100%",
          opacity: loading ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  whiteSpace: "nowrap",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  whiteSpace: "nowrap",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                }}
              >
                Время измерения
              </TableCell>
              {infoVariables
                .filter((v) => !disabledVariables.includes(v.id))
                .map((v) => (
                  <TableCell
                    key={v.id}
                    sx={{
                      whiteSpace: "nowrap",
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold",
                    }}
                  >
                    {v.name}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {infoData.map((group, i) => (
              <TableRow key={group.group.id} hover>
                <TableCell align="center">
                  {page * rowsPerPage + i + 1}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {new Date(group.group.date_utc).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                {infoVariables
                  .filter((v) => !disabledVariables.includes(v.id))
                  .map((variable) => {
                    const value = group.values.find(
                      (e) => e.variable.id === variable.id,
                    );
                    return (
                      <TableCell
                        key={variable.id}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {value?.value ?? "-"}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Строк:"
        sx={{ borderTop: "1px solid #e0e0e0" }}
      />
    </Paper>
  );
}

export default AnalyticTable;
