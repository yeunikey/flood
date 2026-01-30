import { useEffect, useState } from "react";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";

interface User {
  id: number;
  login: string;
  role: "viewer" | "editor" | "admin";
}

export default function UsersWidget() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ login: "", password: "", role: "viewer" });

  const fetchUsers = () => {
    api
      .get<User[]>("auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить пользователя?")) return;
    try {
      await api.delete(`auth/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch {
      toast.error("Не удалось удалить пользователя.");
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.patch(
        `auth/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchUsers();
    } catch {
      toast.error("Не удалось назначить роль.");
    }
  };

  const handleCreate = async () => {
    try {
      await api.post("auth/users", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOpen(false);
      setForm({ login: "", password: "", role: "viewer" });
      fetchUsers();
    } catch {
      toast.error(
        "Не удалось создать пользователя. Возможно, пароль слишком короткий или логин занят.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Создать пользователя
        </Button>
      </div>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Логин</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.login}</TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Chip label="Admin" color="error" size="small" />
                  ) : (
                    <Select
                      value={user.role}
                      size="small"
                      variant="standard"
                      disableUnderline
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                    >
                      <MenuItem value="viewer">Viewer</MenuItem>
                      <MenuItem value="editor">Editor</MenuItem>
                    </Select>
                  )}
                </TableCell>
                <TableCell align="right">
                  {user.role !== "admin" && (
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Новый пользователь</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2!">
          <TextField
            label="Логин"
            fullWidth
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
          />
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select
              label="Роль"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.login || !form.password}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
