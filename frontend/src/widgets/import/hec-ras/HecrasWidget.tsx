import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import {
    Typography,
    Button,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CreateHecRasModal from "./modal/CreateHecRasModal";
import { useHecRas } from "@/entities/hec-ras/model/useHecRas";
import { fetchHecRas } from "@/entities/hec-ras/api/fetchHecRas";

export default function HecRasWidget() {
  const { token } = useAuth();
  const { hecRas } = useHecRas();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchHecRas(token);
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот проект?")) return;
    try {
      await api.delete(`tiles/hec-ras/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Проект удален");
      if (token) fetchHecRas(token);
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при удалении");
    }
  };

  const handleSuccess = () => {
    if (token) fetchHecRas(token);
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4">
      <div className="flex justify-between items-center">
        <Typography variant="h6" fontWeight="medium">
          HEC-RAS Проекты
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Загрузить
        </Button>
      </div>

      <TableContainer
        component={Paper}
        className="flex-1 overflow-auto shadow-sm rounded-lg! border border-gray-200"
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={200}>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Файл</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hecRas.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell className="text-gray-500 font-mono text-xs">
                  {item.id}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.originalFilename}</TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                      title="Удалить"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {hecRas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  className="py-8 text-gray-500"
                >
                  Нет загруженных проектов HEC-RAS.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {createOpen && (
        <CreateHecRasModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
