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
import { useDisabledVariables } from "../model/useDisabledVariables";
import { useAuth } from "@/shared/model/auth";
import { useMonitorStore } from "../model/useMontorStore";
import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import { useEffect, useState } from "react";
import VariablesSettingsModal from "./VariablesSettingsModal";
import ModalBox from "@/shared/ui/el/ModalBox";

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

interface FullscreenTableModalProps {
  open: boolean;
  onClose: () => void;
  variables: Variable[];
}

export default function FullscreenTableModal({
  open,
  onClose,
  variables,
}: FullscreenTableModalProps) {
  const { disabledVariables } = useDisabledVariables();
  const { token } = useAuth();
  const { selectedSite, selectedCategory } = useMonitorStore();

  const [infoData, setInfoData] = useState<GroupedData[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !selectedCategory?.id || !selectedSite?.code) return;

      try {
        const res = await api.get<ApiResponse<PaginatedResult<GroupedData>>>(
          `/data/category/${selectedCategory.id}/by-site/${selectedSite.code}/paginated`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: page + 1, limit: rowsPerPage },
          },
        );
        setInfoData(res.data.data.content);
        setTotalRows(res.data.data.total);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [open, selectedCategory, selectedSite, page, rowsPerPage, token]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 500,
        },
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
                  {selectedSite?.name}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200"
                >
                  {selectedCategory?.name}
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

                        {(variables || [])
                          .filter((v) => !disabledVariables.includes(v.id))
                          .map((v) => (
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
                      {(infoData || []).map((group, i) => (
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
                          {variables
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
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Строк:"
                  sx={{ borderTop: "1px solid #e0e0e0" }}
                />
              </Paper>
            </div>

            <VariablesSettingsModal
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              variables={variables}
            />
          </ModalBox>
        </div>
      </Zoom>
    </Modal>
  );
}
