/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/shared/model/auth";
import {
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Zoom,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
} from "@mui/material";
import { useMonitorStore } from "../model/useMontorStore";
import { api } from "@/shared/model/api/instance";
import { useEffect, useState } from "react";
import { ApiResponse } from "@/types";
import TuneIcon from "@mui/icons-material/Tune";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useDisabledVariables } from "../model/useDisabledVariables";

import VariablesSettingsModal from "../modal/VariablesSettingsModal";
import FullscreenTableModal from "../modal/FullscreenInfoModal";
import DataSource from "@/entities/source/types/sources";

interface Variable {
  id: number;
  name: string;
}
interface DataValue {
  id: number;
  value: string;
  variable: Variable;
}
interface GroupedData {
  group: {
    id: number;
    date_utc: string;
    category: { id: number; name: string };
    site: { id: number; code: string; name: string };
  };
  values: DataValue[];
}
interface PaginatedResult<T> {
  content: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function TableInfo() {
  const { disabledVariables } = useDisabledVariables();
  const { token } = useAuth();
  const { selectedSite, selectedCategory, selectedSource, setSelectedSource } =
    useMonitorStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [infoVariables, setInfoVariables] = useState<Variable[]>([]);
  const [availableSources, setAvailableSources] = useState<DataSource[]>([]);

  const [infoData, setInfoData] = useState<GroupedData[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    if (!selectedCategory || !token) return;

    const controller = new AbortController();

    const fetchVariables = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (selectedSource) params.sourceId = selectedSource.id;
        if (selectedSite) params.siteCode = selectedSite.code;

        const { data } = await api.get<
          ApiResponse<{
            variables: Variable[];
            sources: DataSource[];
          }>
        >(`/data/category/${selectedCategory.id}/variables`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
          signal: controller.signal,
        });

        setInfoVariables(data.data.variables);
        setAvailableSources(data.data.sources);

        if (data.data.sources.length > 0) {
          const currentSourceValid =
            selectedSource &&
            data.data.sources.some((s) => s.id === selectedSource.id);

          if (!currentSourceValid) {
            setSelectedSource(data.data.sources[0]);
          }
        }
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
        }
      }
    };

    fetchVariables();

    return () => controller.abort();
  }, [selectedCategory, token, selectedSite]);

  useEffect(() => {
    if (!selectedCategory || !selectedSite || !token) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: page + 1,
          limit: rowsPerPage,
        };
        if (selectedSource) {
          params.sourceId = selectedSource.id;
        }

        const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
          `/data/category/${selectedCategory.id}/by-site/${selectedSite.code}/paginated`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
            signal: controller.signal,
          },
        );
        setInfoData(res.data.data.content);
        setTotalRows(res.data.data.total);
      } catch (error: any) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [
    selectedCategory,
    selectedSite,
    page,
    rowsPerPage,
    token,
    selectedSource,
  ]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSourceChange = (event: SelectChangeEvent<number>) => {
    const sourceId = Number(event.target.value);
    const source = availableSources.find((s) => s.id === sourceId) || null;
    setSelectedSource(source);
    setPage(0);
  };

  return (
    <Zoom in={true} timeout={600}>
      <div className="flex flex-col h-full w-full">
        <div className="flex-none mb-4 flex gap-2 items-center flex-wrap">
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={() => setSettingsOpen(true)}
          >
            Переменные
          </Button>

          <Tooltip title="На весь экран">
            <Button variant="outlined" onClick={() => setFullscreenOpen(true)}>
              <OpenInFullIcon />
            </Button>
          </Tooltip>

          <FormControl sx={{ maxWidth: 258 }}>
            <InputLabel>Источник</InputLabel>
            <Select
              value={selectedSource?.id ?? ""}
              label="Источник"
              onChange={handleSourceChange}
              size="small"
            >
              {availableSources.map((source) => (
                <MenuItem key={source.id} value={source.id}>
                  {source.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <VariablesSettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            variables={infoVariables}
          />

          <FullscreenTableModal
            open={fullscreenOpen}
            onClose={() => setFullscreenOpen(false)}
            variables={infoVariables}
          />
        </div>

        <div className="flex-1 relative min-h-0 border border-gray-200 rounded-lg overflow-hidden">
          {loading && (
            <LinearProgress
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                borderRadius: "8px 8px 0 0",
              }}
            />
          )}
          <div className="absolute inset-0 flex flex-col bg-white">
            <Paper
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                boxShadow: "none",
              }}
            >
              <TableContainer sx={{ flex: 1, width: "100%" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{
                          whiteSpace: "nowrap",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        #
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "nowrap",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        Время измерения
                      </TableCell>
                      {(infoVariables || [])
                        .filter((v) => !disabledVariables.includes(v.id))
                        .map((v) => (
                          <TableCell
                            key={v.id}
                            sx={{
                              whiteSpace: "nowrap",
                              backgroundColor: "#f5f5f5",
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
                          {new Date(group.group.date_utc).toLocaleString(
                            "ru-RU",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </TableCell>
                        {(infoVariables || [])
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
          </div>
        </div>
      </div>
    </Zoom>
  );
}

export default TableInfo;
