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
import UpdateSpatialModal from "./modal/UpdateSpatialModal";

// Define the composite type used in the array
interface SpatialComposite {
  spatial: Spatial;
  tiles: { id: string; name: string }[];
}

export default function SpatialWidget() {
  const { token } = useAuth();
  const { spatials } = useSpatial(); // Assumed to be SpatialComposite[]
  const [createOpen, setCreateOpen] = useState(false);

  const [editSpatialData, setEditSpatialData] =
    useState<SpatialComposite | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchSpatials(token);
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эти пространственные данные?"))
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

  const handleSuccess = () => {
    if (token) fetchSpatials(token);
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
            {spatials?.map((item) => (
              <TableRow key={item.spatial.id} hover>
                <TableCell>{item.spatial.id}</TableCell>
                <TableCell className="font-medium">
                  {item.spatial.name}
                </TableCell>
                <TableCell>
                  {item.spatial.tileIds?.length ? (
                    <Chip label={item.spatial.tileIds.length} size="small" />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      item.spatial.style?.type === "gradient"
                        ? "Градиент"
                        : "Солид"
                    }
                    color={
                      item.spatial.style?.type === "gradient"
                        ? "primary"
                        : "default"
                    }
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {item.spatial.legend?.enabled ? (
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
                      onClick={() => setEditSpatialData(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.spatial.id)}
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

      {createOpen && (
        <CreateSpatialModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editSpatialData && (
        <UpdateSpatialModal
          open={!!editSpatialData}
          spatialData={editSpatialData}
          onClose={() => setEditSpatialData(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
