import { useImportStore } from "@/features/import/model/useImportStore";
import ImportStepper from "@/features/import/ui/ImportStepper";
import SelectMetadata from "@/features/import/ui/metadata/SelectMetadata";
import { Badge, Button, Typography } from "@mui/material";
import { useProgressModal } from "@/features/import/model/modal/useProgressModal";
import SelectSite from "@/features/import/ui/metadata/SelectSite";

function Metadata() {

    const { setStepperLevel } = useImportStore();

    const cancelCsv = () => {
        setStepperLevel(1);
    }

    const { setOpen: setProgressModal } = useProgressModal();

    const loadToServer = () => {
        setProgressModal(true);
    }

    return (
        <div className="py-16 px-24 w-full">

            <div className="w-2xl mx-auto">
                <ImportStepper />
            </div>

            <div className="mt-24">
                <div className="flex justify-center">
                    <Badge badgeContent={'Шаг #3'} color="primary"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                    >
                        <Typography variant="h4" fontWeight={500}>Заполните метаданные</Typography>
                    </Badge>
                </div>

                <Typography variant="body1" color="grey.500" textAlign={'center'}>
                    Заполните метаданные
                    снизу в таблице
                </Typography>

                <div className="flex gap-3 justify-center">
                    <SelectSite />
                    <SelectMetadata />
                </div>

                <div className="mt-10 flex justify-center gap-3">
                    <Button variant="contained" color="error" onClick={cancelCsv}>Назад</Button>
                    <Button variant="contained" color="primary" onClick={loadToServer}>Сохранить в сервер</Button>
                </div>
            </div>
        </div>
    );
}

export default Metadata;