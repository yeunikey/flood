import {
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import { useCategorySelection } from "../../model/useCategorySelection";
import { useEffect } from "react";
import { useAuth } from "@/shared/model/auth";
import { useImportStore } from "../../model/useImportStore";
import AddIcon from "@mui/icons-material/Add";
import { useSourceModal } from "../../model/modal/useSourceModal";
import CreateSourceModal from "../modal/CreateSourceModal";
import { useQclModal } from "../../model/modal/useQclModal";
import { useMethodModal } from "../../model/modal/useMethodModal";
import CreateQclModal from "../modal/CreateQclModal";
import CreateMethodModal from "../modal/CreateMethodModal";
import { fetchQcls } from "../../model/services/qclService";
import { fetchSources } from "../../model/services/sourceService";
import { fetchMethods } from "../../model/services/methodService";
import { useQcl } from "@/entities/qcl/model/useQcl";
import { useSources } from "@/entities/source/model/useSource";
import { useMethods } from "@/entities/method/model/useMethod";

function SelectMetadata() {
  const { token } = useAuth();
  const { selectedCategory } = useCategorySelection();

  const { qcls } = useQcl();
  const { sources } = useSources();
  const { methods } = useMethods();

  const {
    selectedMethod,
    selectedQcl,
    selectedSource,
    setSelectedMethod,
    setSelectedQcl,
    setSelectedSource,
  } = useImportStore();

  const { setOpen: setSourceModal } = useSourceModal();
  const { setOpen: setQclModal } = useQclModal();
  const { setOpen: setMethodModal } = useMethodModal();

  useEffect(() => {
    if (!token) return;

    fetchMethods();
    fetchQcls();
    fetchSources();
  }, [token]);

  return (
    <Zoom in={true} timeout={500}>
      <div className="mt-10 rounded-lg border border-gray-200 w-fit p-5">
        <CreateSourceModal />
        <CreateQclModal />
        <CreateMethodModal />

        <Typography variant="h6">Общие данные</Typography>

        <div className="mt-6 space-y-3">
          {/* Категория */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Typography variant="subtitle2" className="w-32 shrink-0">
              Категория:
            </Typography>
            <TextField
              size="small"
              value={selectedCategory?.name || ""}
              disabled
              fullWidth
              inputProps={{ style: { textOverflow: "ellipsis" } }}
            />
          </div>

          {/* Source */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Typography variant="subtitle2" className="w-32 shrink-0">
              Источник информации:
            </Typography>
            <div className="flex gap-2">
              <FormControl sx={{ width: 96 * 5 }}>
                <Select
                  size="small"
                  value={selectedSource?.id ?? ""}
                  onChange={(e) => {
                    const source =
                      sources.find((s) => s.id === Number(e.target.value)) ||
                      null;
                    setSelectedSource(source);
                  }}
                  displayEmpty
                  autoWidth
                >
                  <MenuItem value="" disabled>
                    Выберите источник
                  </MenuItem>
                  {sources.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Создать новую">
                <IconButton
                  size="medium"
                  className="h-full aspect-square"
                  onClick={() => setSourceModal(true)}
                >
                  <AddIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* QCL */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Typography variant="subtitle2" className="w-32 shrink-0">
              Контроль качества:
            </Typography>
            <div className="flex gap-2">
              <FormControl sx={{ width: 96 * 5 }}>
                <Select
                  size="small"
                  fullWidth
                  value={selectedQcl?.id ?? ""}
                  onChange={(e) => {
                    const qcl =
                      qcls.find((q) => q.id === Number(e.target.value)) || null;
                    setSelectedQcl(qcl);
                  }}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Выберите контроль качества
                  </MenuItem>
                  {qcls.map((q) => (
                    <MenuItem key={q.id} value={q.id}>
                      {q.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Создать новую">
                <IconButton
                  size="medium"
                  className="h-full aspect-square"
                  onClick={() => setQclModal(true)}
                >
                  <AddIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* Method */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Typography variant="subtitle2" className="w-32 shrink-0">
              Метод измерения:
            </Typography>
            <div className="flex gap-2 w-full">
              <FormControl sx={{ width: 96 * 5 }}>
                <Select
                  size="small"
                  fullWidth
                  value={selectedMethod?.id ?? ""}
                  onChange={(e) => {
                    const method =
                      methods.find((m) => m.id === Number(e.target.value)) ||
                      null;
                    setSelectedMethod(method);
                  }}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Выберите метод измерения
                  </MenuItem>
                  {methods.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Создать новую">
                <IconButton
                  size="medium"
                  className="h-full aspect-square"
                  onClick={() => setMethodModal(true)}
                >
                  <AddIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Zoom>
  );
}

export default SelectMetadata;
