/* eslint-disable react-hooks/set-state-in-effect */
import {
  Modal,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Zoom,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import { useAuth } from "@/shared/model/auth";
import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import { useEffect, useState, useMemo } from "react";
import VariablesSettingsModal from "./VariablesSettingsModal";
import ModalBox from "@/shared/ui/el/ModalBox";
import { AnalyticSite } from "@/features/analytic/model/useAnalyticSites";
import { Category } from "@/entities/category/types/categories";
import Variable from "@/entities/variable/types/variable";
import useAnalyticStore from "../model/useAnalyticStore";
import { GroupedData, PaginatedResult } from "@/shared/model/types/response";

interface FullscreenTableModalProps {
  open: boolean;
  onClose: () => void;
  site: AnalyticSite | null;
  category: Category | null;
  variables: Variable[];
}

export default function FullscreenTableModal({
  open,
  onClose,
  site,
  category,
  variables,
}: FullscreenTableModalProps) {
  // 1. Получаем весь словарь отключенных переменных
  const disabledVariablesMap = useAnalyticStore(
    (state) => state.disabledVariables,
  );
  const { token } = useAuth();

  const [infoData, setInfoData] = useState<GroupedData[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // 2. Вычисляем список ID отключенных переменных для ТЕКУЩЕГО сайта и категории
  const currentDisabledIds = useMemo(() => {
    if (!site || !category) return [];
    const key = `${category.id}-${site.id}`;
    return disabledVariablesMap[key] || [];
  }, [disabledVariablesMap, site, category]);

  // 3. Фильтруем переменные, исключая отключенные
  const activeVariables = useMemo(() => {
    return variables.filter((v) => !currentDisabledIds.includes(v.id));
  }, [variables, currentDisabledIds]);

  useEffect(() => {
    if (open) {
      setPage(0);
    }
  }, [open, site?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !category?.id || !site?.code) return;

      try {
        const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
          `/data/category/${category.id}/by-site/${site.code}/paginated`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: page + 1, limit: rowsPerPage },
          },
        );
        if (res.data.data) {
          setInfoData(res.data.data.content);
          setTotalRows(res.data.data.total);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [open, category, site, page, rowsPerPage, token]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!site || !category) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: { timeout: 500 },
      }}
    >
      <Zoom in={open} timeout={500}>
        <div className="outline-none flex items-center justify-center h-full w-full pointer-events-none">
          <ModalBox className="relative w-[95dvw]! h-[95dvh]! overflow-hidden flex flex-col outline-none pointer-events-auto bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800"
                >
                  {site.name}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200"
                >
                  {category.name}
                </Typography>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setSettingsOpen(true)}
                >
                  Переменные
                </Button>

                <IconButton onClick={onClose} color="primary">
                  <CloseIcon />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-50 p-4">
              <Paper
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <TableContainer sx={{ flex: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          align="center"
                          sx={{
                            whiteSpace: "nowrap",
                            backgroundColor: "#f9fafb",
                            fontWeight: 600,
                          }}
                        >
                          #
                        </TableCell>
                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                            backgroundColor: "#f9fafb",
                            fontWeight: 600,
                          }}
                        >
                          Время измерения
                        </TableCell>

                        {/* Используем отфильтрованные переменные */}
                        {activeVariables.map((v) => (
                          <TableCell
                            key={v.id}
                            sx={{
                              whiteSpace: "nowrap",
                              backgroundColor: "#f9fafb",
                              fontWeight: 600,
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

                          {/* Используем отфильтрованные переменные */}
                          {activeVariables.map((variable) => {
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
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Строк:"
                  sx={{ borderTop: "1px solid #e0e0e0" }}
                />
              </Paper>
            </div>

            <VariablesSettingsModal
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
          </ModalBox>
        </div>
      </Zoom>
    </Modal>
  );
}
