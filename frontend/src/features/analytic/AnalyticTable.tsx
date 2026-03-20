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
  Box,
} from "@mui/material";
import { useEffect } from "react";
import { useAuth } from "@/shared/model/auth";
import { AnalyticSite, useAnalyticSites } from "./model/useAnalyticSites";
import useAnalyticStore from "./model/useAnalyticStore";
import { fetchAnalyticData } from "./model/fetchCategory";
import { FormattedGroup } from "./model/useAnalyticSites";

type TableProps = {
  selectedSite: AnalyticSite;
  selectedSourceId?: number;
};

function AnalyticTable({ selectedSite, selectedSourceId }: TableProps) {
  const { token } = useAuth();
  const { fromDate, toDate, disabledVariables } = useAnalyticStore();
  const { activeSites, setSitePage, setSiteRowsPerPage } = useAnalyticSites();

  const record = activeSites[selectedSite.category.id];
  const siteState = record.sites.find((s) => s.id === selectedSite.id);
  const variables = record.variables;

  const loading = siteState?.loading ?? false;
  const infoData = (siteState?.result?.content as unknown as FormattedGroup[]) ?? [];
  const totalRows = siteState?.result?.total ?? 0;
  const page = siteState?.page ?? 0;
  const rowsPerPage = siteState?.rowsPerPage ?? 10;

  const isDisabled = (varId: number) => {
    const key = `${selectedSite.category.id}-${selectedSite.id}`;
    return disabledVariables[key]?.includes(varId);
  };

  useEffect(() => {
    if (selectedSourceId !== undefined) {
      setSitePage(selectedSite.category.id, selectedSite.id, 0);
    }
  }, [selectedSourceId, selectedSite.category.id, selectedSite.id, setSitePage]);

  useEffect(() => {
    if (!token || !siteState) return;

    fetchAnalyticData(
      token,
      selectedSite,
      page,
      rowsPerPage,
      fromDate,
      toDate,
      selectedSourceId,
    );
  }, [page, rowsPerPage, fromDate, toDate, selectedSourceId, token, selectedSite.id]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setSitePage(selectedSite.category.id, selectedSite.id, newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSiteRowsPerPage(
      selectedSite.category.id,
      selectedSite.id,
      parseInt(event.target.value, 10),
    );
  };

  return (
    <Paper
      elevation={0}
      className="border border-gray-200 rounded-lg! h-[450px]"
      sx={{
        width: "100%",
        position: "relative",
        display: "grid",
        gridTemplateRows: "1fr auto",
      }}
    >
      {loading && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
          }}
        />
      )}

      <Box sx={{ overflowX: "auto", width: "100%", minHeight: 0 }}>
        <TableContainer
          sx={{
            width: "100%",
            height: "100%",
            overflow: "auto",
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
                    backgroundColor: "#f1f5f9",
                    fontWeight: "semibold",
                    paddingY: "12px",
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    whiteSpace: "nowrap",
                    backgroundColor: "#f1f5f9",
                    fontWeight: "semibold",
                    paddingY: "12px",
                  }}
                >
                  Время измерения
                </TableCell>
                {variables
                  .filter((v) => !isDisabled(v.id))
                  .map((v) => (
                    <TableCell
                      key={v.id}
                      sx={{
                        whiteSpace: "nowrap",
                        backgroundColor: "#f1f5f9",
                        fontWeight: "semibold",
                        paddingY: "12px",
                      }}
                    >
                      {v.name}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {infoData.map((group, i) => (
                <TableRow key={group.id} hover>
                  <TableCell align="center">
                    {page * rowsPerPage + i + 1}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(group.date_utc).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  {variables
                    .filter((v) => !isDisabled(v.id))
                    .map((variable) => {
                      const vIndex = (group.variables ?? []).indexOf(variable.id);
                      const valStr = vIndex !== -1 ? group.values?.[vIndex] : undefined;

                      return (
                        <TableCell
                          key={variable.id}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {valStr !== undefined &&
                          !isNaN(Number(valStr)) &&
                          valStr !== ""
                            ? Number(valStr).toFixed(3) +
                              " " +
                              variable.unit.symbol
                            : (valStr ?? "-")}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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