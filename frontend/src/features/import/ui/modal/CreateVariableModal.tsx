/* eslint-disable react-hooks/immutability */
import {
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { useAuth } from "@/shared/model/auth";
import { useImportStore } from "../../model/useImportStore";
import { useVariableModal } from "../../model/modal/useVariableModal";
import ModalBox from "@/shared/ui/el/ModalBox";
import {
  handleCreateVariable,
  handleDeleteVariable,
} from "../../model/services/variableService";
import { Variable } from "@/types";
import { useUnits } from "@/entities/unit/model/useUnits";
import { useVariables } from "@/entities/variable/model/useVariables";

function CreateVariableModal() {
  const { token } = useAuth();

  const { open, setOpen } = useVariableModal();

  const { variables, fetchVariables } = useVariables();
  const { units, fetchUnits } = useUnits();

  const { headerIndex } = useVariableModal();
  const { headers, headerVariableMap } = useImportStore();

  const [variableMode, setVariableMode] = useState<"existing" | "create">(
    "existing",
  );
  const [unitMode, setUnitMode] = useState<"existing" | "create">("existing");

  const [selectedVariableId, setSelectedVariableId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");
  const [unitDescription, setUnitDescription] = useState("");

  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetchUnits(token);
    fetchVariables(token);
  }, [token]);

  useEffect(() => {
    if (headerIndex >= 0) {
      const header = headers[headerIndex];
      const variableId = headerVariableMap[header];

      if (variableId) {
        setSelectedVariableId(String(variableId));
        setVariableMode("existing");
      }
    }
  }, [headerIndex, open]);

  useEffect(() => {
    resetForm();
  }, [headerIndex]);

  const filterVariables = (variables: Variable[]) => {
    return variables.filter((v) => {
      const usedVariableIds = Object.entries(headerVariableMap)
        .filter(([header]) => {
          const currentHeader = headers[headerIndex];
          return header !== currentHeader;
        })
        .map(([, variableId]) => variableId);

      return !usedVariableIds.includes(v.id);
    });
  };

  const resetForm = () => {
    setVariableMode("existing");
    setUnitMode("existing");

    setSelectedVariableId("");
    setSelectedUnitId("");

    setName("");
    setDescription("");

    setUnitName("");
    setUnitSymbol("");
    setUnitDescription("");

    setFetching(false);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <ModalBox>
        <div className="flex flex-col gap-2">
          <div>
            <Typography variant="h6">Редактирование переменной</Typography>

            <Typography variant="body2" color="text.secondary">
              Выберите действие ниже
            </Typography>
          </div>

          <Divider />
        </div>

        <FormControl fullWidth size="small">
          <InputLabel>Переменная</InputLabel>
          <Select
            value={variableMode}
            onChange={(e) =>
              setVariableMode(e.target.value as "existing" | "create")
            }
            label="Переменная"
          >
            <MenuItem value="existing">Выбрать из существующих</MenuItem>
            <MenuItem value="create">Создать новую переменную</MenuItem>
          </Select>
        </FormControl>

        {variableMode === "existing" ? (
          <FormControl fullWidth size="small">
            <InputLabel>Существующая переменная</InputLabel>
            <Select
              value={selectedVariableId}
              onChange={(e) => setSelectedVariableId(e.target.value)}
              label="Существующая переменная"
            >
              {filterVariables(variables).map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <TextField
                label="Название переменной"
                variant="outlined"
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Описание переменной"
                variant="outlined"
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Divider>
              <Typography variant="body2" color="text.secondary">
                Единица измерения
              </Typography>
            </Divider>

            <FormControl fullWidth size="small">
              <InputLabel>Единица</InputLabel>
              <Select
                value={unitMode}
                onChange={(e) =>
                  setUnitMode(e.target.value as "existing" | "create")
                }
                label="Единица"
              >
                <MenuItem value="existing">Выбрать из существующих</MenuItem>
                <MenuItem value="create">Создать новую единицу</MenuItem>
              </Select>
            </FormControl>

            {unitMode === "existing" ? (
              <FormControl fullWidth size="small">
                <InputLabel>Существующая единица</InputLabel>
                <Select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  label="Существующая единица"
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <div className="flex flex-col gap-2">
                <TextField
                  label="Имя единицы"
                  variant="outlined"
                  size="small"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                />
                <TextField
                  label="Символ"
                  variant="outlined"
                  size="small"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                />
                <TextField
                  label="Описание"
                  variant="outlined"
                  size="small"
                  value={unitDescription}
                  onChange={(e) => setUnitDescription(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDeleteVariable()}
            disabled={fetching}
          >
            Удалить
          </Button>

          <Button
            variant="contained"
            onClick={() =>
              handleCreateVariable(
                variableMode,
                unitMode,
                fetching,
                setFetching,
                selectedVariableId,
                selectedUnitId,
                name,
                description,
                unitName,
                unitSymbol,
                unitDescription,
                resetForm,
              )
            }
            disabled={fetching}
          >
            Сохранить
          </Button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export default CreateVariableModal;
