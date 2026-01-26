"use client";

import ImportStepper from "@/features/import/ui/ImportStepper";
import { Badge, Button, Typography } from "@mui/material";
import ImportTable from "@/features/import/ui/ImportTable";
import { useImportStore } from "@/features/import/model/useImportStore";
import { toast } from "react-toastify";
import { useVariables } from "@/entities/variable/model/useVariables";

function TableCsv() {
  const {
    headers,
    headerVariableMap,
    setStepperLevel,
    stepperLevel,
    setFile,
    setHeaders,
    setRows,
    resetHeaderVariableMap,
    setSelectedMethod,
    setSelectedQcl,
    setSelectedSource,
  } = useImportStore();
  const { variables } = useVariables();

  const cancelCsv = () => {
    setFile(null);
    setStepperLevel(0);

    setHeaders([]);
    setRows([]);
    resetHeaderVariableMap();

    setSelectedMethod(null);
    setSelectedQcl(null);
    setSelectedSource(null);

    toast.warn("Данные предыдущего .csv не сохранились");
  };

  const nextStep = () => {
    const allHeadersMapped = headers.every((header) => {
      if (header.toLowerCase() == "datetime") return true;
      if (header.toLowerCase() == "code") return true;
      const variableId = headerVariableMap[header];
      return variables.some((v) => v.id === variableId);
    });

    if (!allHeadersMapped) {
      toast.error("Не все колонки сопоставлены с переменными");
      return;
    }

    setStepperLevel(stepperLevel + 1);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 py-6 px-24">
        <div className="w-2xl mx-auto">
          <ImportStepper />
        </div>

        <div className="mt-8">
          <div className="flex justify-center">
            <Badge
              badgeContent={"Шаг #2"}
              color="primary"
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
            >
              <Typography variant="h4" fontWeight={500}>
                Сопоставьте колонки
              </Typography>
            </Badge>
          </div>

          <Typography variant="body1" color="grey.500" textAlign={"center"}>
            Сопоставьте колонки снизу в таблице
          </Typography>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-24">
        <ImportTable />
      </div>

      <div className="flex-shrink-0 py-6 px-24 flex justify-center gap-3">
        <Button variant="contained" color="error" onClick={cancelCsv}>
          Назад
        </Button>
        <Button variant="contained" color="primary" onClick={nextStep}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}

export default TableCsv;
