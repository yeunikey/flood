import {
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Zoom,
} from "@mui/material";
import { useImportStore } from "../model/useImportStore";
import EditIcon from '@mui/icons-material/Edit';
import { useVariableModal } from "../model/modal/useVariableModal";
import { useVariables } from "@/entities/variable/model/useVariables";

function ImportTable() {

    const { headers, rows, headerVariableMap } = useImportStore();
    const { variables } = useVariables();

    const { setOpen, setHeaderIndex } = useVariableModal();

    const openVariableModal = (index: number) => {
        setOpen(true);
        setHeaderIndex(index);
    };

    const renderCell = (idx: number, header: string, variableName?: string) => {
        return <TableCell key={idx} className="relative">
            {header == 'datetime' || header == 'code' ? (
                <div className="relative flex gap-3 items-center">
                    <div className="relative">
                        {variableName || header}

                    </div>
                </div>
            ) : (
                <>
                    <div className="relative flex gap-3 items-center">
                        <div className="relative">
                            {variableName || header}

                        </div>

                        <Tooltip title="Редактировать переменную" onClick={() => openVariableModal(idx)}>
                            <IconButton size="small">
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                    </div>

                    <div className={`absolute -bottom-1 left-0 ${variableName ? 'bg-green-500' : 'bg-red-500'} w-2 h-2 rounded-full`} />
                </>
            )}
        </TableCell>
    }

    return (
        <Zoom in={true} timeout={500}>
            <div className="mt-10 overflow-auto rounded-lg border border-gray-200">
                <TableContainer component={Paper}>
                    <Table sx={{ width: "100%" }} aria-label="imported csv table">
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                {headers.map((header, idx) => {
                                    const variableId = headerVariableMap[header];
                                    const variableName = variables.find(v => v.id === variableId)?.name;

                                    return (
                                        renderCell(idx, header, variableName)
                                    );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.slice(0, 5).map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    <TableCell>{rowIndex + 1}</TableCell>
                                    {row.map((cell, colIndex) => (
                                        <TableCell key={colIndex}>{cell}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </Zoom>
    );
}

export default ImportTable;
