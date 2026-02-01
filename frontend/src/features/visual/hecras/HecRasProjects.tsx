/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Menu,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { api, vapi } from "@/shared/model/api/instance";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function HecRasProjects() {
  const navigate = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get("tiles/hec-ras");
      if (res.status === 200) {
        const data = res.data;
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!newProjectName || !selectedFile) return;

    const formData = new FormData();
    formData.append("name", newProjectName);
    formData.append("file", selectedFile);

    try {
      const res = await vapi.post("tiles/hec-ras/upload", formData);

      if (res.status) {
        loadProjects();
        setOpenAdd(false);
        setNewProjectName("");
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      await api.delete(`tiles/hec-ras/${selectedProject.id}`);
      loadProjects();
      setContextMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">HEC-RAS Проекты</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          Добавить
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((proj) => (
              <TableRow
                key={proj.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedProject(proj);
                  setContextMenu({
                    mouseX: e.clientX + 2,
                    mouseY: e.clientY - 6,
                  });
                }}
                sx={{ cursor: "context-menu" }}
              >
                <TableCell>{proj.name}</TableCell>
                <TableCell>
                  {new Date(proj.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => navigate.push(`/visual/hec-ras/${proj.id}`)}
                  >
                    Просмотр
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Добавить проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <Button component="label" sx={{ mt: 2 }}>
            Выбрать .db файл
            <input
              type="file"
              hidden
              accept=".db,.sqlite"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </Button>
          {selectedFile && (
            <Typography variant="caption" display="block">
              {selectedFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Отмена</Button>
          <Button onClick={handleUpload}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleDelete}>Удалить</MenuItem>
      </Menu>
    </Box>
  );
}
