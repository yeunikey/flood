import { api } from "@/shared/model/api/instance";
import { Unit, ApiResponse, Variable } from "@/types";
import { toast } from "react-toastify";
import { useImportStore } from "../useImportStore";
import { useVariableModal } from "../modal/useVariableModal";
import { useAuth } from "@/shared/model/auth";
import { useVariables } from "@/entities/variable/model/useVariables";
import { useUnits } from "@/entities/unit/model/useUnits";

const handleCreateVariable = async (
    variableMode: "existing" | "create",
    unitMode: "existing" | "create",

    fetching: boolean,
    setFetching: (fetching: boolean) => void,

    selectedVariableId: string,
    selectedUnitId: string,

    name: string,
    description: string,

    unitName: string,
    unitSymbol: string,
    unitDescription: string,

    resetForm: () => void

) => {

    const { token } = useAuth.getState();
    const { setOpen } = useVariableModal.getState();

    const { addVariable } = useVariables.getState();
    const { addUnit } = useUnits.getState();

    const { headerIndex } = useVariableModal.getState();
    const { headers, setVariableForHeader } = useImportStore.getState();

    if (fetching) {
        toast.warning("Ожидайте ответа");
        return;
    }

    if (variableMode === "existing") {
        if (!selectedVariableId) {
            toast.error("Выберите переменную");
            return;
        }

        if (headerIndex >= 0) {
            setVariableForHeader(headers[headerIndex], Number(selectedVariableId));
            toast.success(`Переменная привязана к "${headers[headerIndex]}"`);
        } else {
            toast.success("Переменная выбрана");
        }

        setOpen(false);
        return;
    }

    if (!name || !description) {
        toast.error("Заполните название и описание переменной");
        return;
    }

    if (unitMode === "create" && (!unitName || !unitSymbol)) {
        toast.error("Заполните данные новой единицы измерения");
        return;
    }

    if (unitMode === "existing" && !selectedUnitId) {
        toast.error("Выберите существующую единицу");
        return;
    }

    setFetching(true);

    const body: { name: string, description: string, unit?: Unit, unitId?: number } = {
        name,
        description,
    };

    if (unitMode === "existing") {
        body.unitId = Number(selectedUnitId);
    } else {
        body.unit = {
            id: 0,
            name: unitName,
            symbol: unitSymbol,
            description: unitDescription,
        };
    }

    try {
        const { data } = await api.post<ApiResponse<Variable>>("/variables", body, {
            headers: { Authorization: "Bearer " + token },
        });

        if (data.statusCode !== 200) {
            toast.error(data.message || "Ошибка при создании");
            return;
        }

        const createdVariable = data.data;

        if (createdVariable.unit && unitMode === "create") {
            addUnit(createdVariable.unit);
        }

        addVariable(createdVariable);

        const variableId = createdVariable.id;

        if (headerIndex >= 0) {
            setVariableForHeader(headers[headerIndex], variableId);
            toast.success(`Переменная создана и привязана к "${headers[headerIndex]}"`);
        } else {
            toast.success("Переменная успешно создана");
        }

        setOpen(false);
        resetForm();

    } catch {
        toast.error("Ошибка при сохранении");
    } finally {
        setFetching(false);
    }
};

const handleDeleteVariable = async () => {

    const { setOpen } = useVariableModal.getState();

    const { headerIndex } = useVariableModal.getState();
    const { headers, setHeaders, setRows, headerVariableMap } = useImportStore.getState();

    if (headerIndex < 0) return;

    const headerToDelete = headers[headerIndex];
    const newHeaders = headers.filter((_, idx) => idx !== headerIndex);

    const newHeaderVariableMap = { ...headerVariableMap };
    delete newHeaderVariableMap[headerToDelete];

    const newRows = useImportStore.getState().rows.map((row) => {
        return row.filter((_, idx) => idx !== headerIndex);
    });

    setHeaders(newHeaders);
    setRows(newRows);

    setOpen(false);
}

export {
    handleCreateVariable,
    handleDeleteVariable
}