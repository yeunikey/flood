import { fetchSpatials } from "@/entities/spatial/api/fetchSpatials";
import { useSpatial } from "@/entities/spatial/model/useSpatial";
import { Spatial } from "@/entities/spatial/types/spatial";
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
  Chip,
  IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CreateSpatialModal from "./modal/CreateSpatialModal";

export default function SpatialWidget() {
  const { token } = useAuth();
  const { spatials } = useSpatial();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSpatial, setEditSpatial] = useState<Spatial | null>(null);

  useEffect(() => {
    if (!token) return;

    fetchSpatials(token);
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this spatial object?"))
      return;
    try {
      await api.delete(`spatial/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Spatial deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4">
      <div className="flex justify-between items-center">
        <Typography variant="h6" fontWeight="medium">
          Пространственные данные
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Создать
        </Button>
      </div>

      <TableContainer
        component={Paper}
        className="flex-1 overflow-auto shadow-sm rounded-lg"
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={50}>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Количество тайлов</TableCell>
              <TableCell>Тип стиля</TableCell>
              <TableCell>Легенда</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {spatials?.map((spatial) => (
              <TableRow key={spatial.id} hover>
                <TableCell>{spatial.id}</TableCell>
                <TableCell className="font-medium">{spatial.name}</TableCell>
                <TableCell>
                  {spatial.tileIds?.length ? (
                    <Chip label={spatial.tileIds.length} size="small" />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      spatial.style?.type === "gradient" ? "Gradient" : "Solid"
                    }
                    color={
                      spatial.style?.type === "gradient" ? "primary" : "default"
                    }
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {spatial.legend?.enabled ? (
                    <span className="text-green-600 text-sm">Включено</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Отключено</span>
                  )}
                </TableCell>
                <TableCell align="right">
                  <div className="flex justify-end gap-1">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setEditSpatial(spatial)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(spatial.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!spatials || spatials.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  className="py-8 text-gray-500"
                >
                  Нет загруженных пространственных данных.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      {createOpen && (
        <CreateSpatialModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Update Modal */}
      {/* {editSpatial && (
        <UpdateSpatialModal
          open={!!editSpatial}
          spatial={editSpatial}
          onClose={() => setEditSpatial(null)}
          onSuccess={handleSuccess}
        />
      )} */}
    </div>
  );
}
