import { Button, styled } from "@mui/material";

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Papa from "papaparse";
import { toast } from "react-toastify";
import { useImportStore } from "../model/useImportStore";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function ImportFile() {
    const { setFile, setStepperLevel, setHeaders, setRows } = useImportStore();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];

        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);

            Papa.parse(selectedFile, {
                complete: (result) => {
                    const data = result.data as string[][];

                    const cleanedData = data.filter(row => row.some(cell => cell.trim() !== ''));

                    if (cleanedData.length > 1) {
                        if (!cleanedData[0].find(r => r.toLowerCase() === 'datetime') || !cleanedData[0].find(r => r.toLowerCase() === 'code')) {
                            toast.error('.csv файл должен содержать поле datetime и code');
                            return;
                        }

                        setHeaders(cleanedData[0]);
                        setRows(cleanedData.slice(1));
                        toast.success('.csv файл выбран');
                        setStepperLevel(1);
                    }
                },
                skipEmptyLines: true,
                encoding: "UTF-8",
            });

        } else {
            toast.warn('Пожалуйста, выберите CSV-файл');
        }

    }; return (
        <div className="mt-16 flex gap-6 items-center justify-center">
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
            >
                Выбрать файл

                <VisuallyHiddenInput
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                />
            </Button>
        </div>
    );
}

export default ImportFile;