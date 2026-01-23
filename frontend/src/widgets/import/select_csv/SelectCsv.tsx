import ImportStepper from "@/features/import/ui/ImportStepper";
import ImportFile from "@/features/import/ui/ImportFile";
import { Badge, Typography } from "@mui/material";


function SelectCsv() {
    return (
        <div className="py-16 w-2xl mx-auto">
            <ImportStepper />

            <div className="mt-24">
                <div className="flex justify-center">
                    <Badge badgeContent={'Шаг #1'} color="primary"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                    >
                        <Typography variant="h4" fontWeight={500}>Загрузите CSV</Typography>
                    </Badge>
                </div>

                <Typography variant="body1" color="grey.500" textAlign={'center'}>Выберите файл снизу</Typography>

                <ImportFile />

                <div className="mt-3">
                    <Typography variant="body1" color="grey.500" textAlign={'center'}>* Для проверки покажем первые 5 строк</Typography>
                </div>

            </div>
        </div>
    );
}

export default SelectCsv;