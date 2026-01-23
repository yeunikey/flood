import { Step, StepLabel, Stepper } from "@mui/material";
import { useImportStore } from "../model/useImportStore";

function ImportStepper() {
    const { stepperLevel } = useImportStore();

    return (
        <Stepper activeStep={stepperLevel} alternativeLabel>
            <Step>
                <StepLabel>Загрузите CSV</StepLabel>
            </Step>
            <Step>
                <StepLabel>Сопоставьте колонки</StepLabel>
            </Step>
            <Step>
                <StepLabel>Заполните метаданные</StepLabel>
            </Step>
        </Stepper>
    );
}

export default ImportStepper;