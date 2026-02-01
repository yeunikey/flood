import {
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Modal,
} from "@mui/material";
import { useState } from "react";
import { vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Loading from "@/shared/ui/el/Loading";
import ModalBox from "@/shared/ui/el/ModalBox";

interface CreateHecRasModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateHecRasModal({
  open,
  onClose,
  onSuccess,
}: CreateHecRasModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !file || !token) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    try {
      await vapi.post("tiles/hec-ras/upload", formData, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      toast.success("Проект успешно загружен");
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при загрузке");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!name) {
        setName(e.target.files[0].name.replace(/\.db$/i, ""));
      }
    }
  };

  return (
    <Modal open={open}>
      <ModalBox className="relative w-2xl! overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/25 flex flex-col justify-center items-center z-50">
            <Loading />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Typography variant="h6">
            Создание пространственного объекта
          </Typography>
          <Divider />
        </div>

        <div className="flex flex-col gap-4">
          <Box
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            component="label"
          >
            <input
              type="file"
              accept=".db"
              hidden
              onChange={handleFileChange}
            />
            <CloudUploadIcon className="text-gray-400 text-4xl mb-2" />
            <Typography variant="body1" className="text-gray-600 font-medium">
              {file ? file.name : "Нажмите для выбора .db файла"}
            </Typography>
            {!file && (
              <Typography variant="caption" className="text-gray-400">
                Поддерживаются только файлы SQLite (.db)
              </Typography>
            )}
          </Box>

          <TextField
            label="Название проекта"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
          />
        </div>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!name || !file || loading}
          >
            {loading ? "Загрузка..." : "Сохранить"}
          </Button>
        </DialogActions>
      </ModalBox>
    </Modal>
  );
}
