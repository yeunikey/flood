/* eslint-disable react-hooks/set-state-in-effect */
import { Box, CircularProgress, Divider, Modal, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { sendDataToServer } from "../../model/websocket";
import { useProgressModal } from "../../model/modal/useProgressModal";

function ProgressModal() {

    const { open, setOpen } = useProgressModal();
    const [logs, setLogs] = useState<string[]>([]);

    const [sentChunks, setSentChunks] = useState(0);
    const [totalChunks, setTotalChunks] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number | null>(null);
    const logEndRef = useRef<HTMLDivElement | null>(null);

    const [isUploading, setIsUploading] = useState(true);

    const log = (message: string) => {
        setLogs((prev) => [...prev, message]);
    };

    useEffect(() => {
        if (startTime && sentChunks > 0 && totalChunks > 0 && sentChunks < totalChunks) {
            const now = Date.now();
            const elapsed = (now - startTime) / 1000;
            const avgPerChunk = elapsed / sentChunks;
            const remainingChunks = totalChunks - sentChunks;
            const estimated = Math.round(avgPerChunk * remainingChunks);
            setEstimatedTimeLeft(estimated);
        } else if (sentChunks === totalChunks) {
            setEstimatedTimeLeft(0); 
        }
    }, [sentChunks, startTime, totalChunks]);

    useEffect(() => {
        if (open) {
            setLogs(["📥 Файл принят"]);
            sendDataToServer(750, log, setSentChunks, setTotalChunks, setStartTime, setIsUploading);
        }
    }, [open]);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView();
        }
    }, [logs]);

    return (
        <Modal
            open={open}
            onClose={() => {
                // if (!isUploading) setOpen(false);
                setOpen(false);
            }}
            disableEscapeKeyDown={isUploading}
            hideBackdrop={false}
        >
            <Box sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                borderRadius: 4,
                overflow: "hidden",
                height: 96 * 4,
            }}>                <Box sx={{
                width: 480,
                bgcolor: "background.paper",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                    <div className="test">
                        <Typography variant="h6">Загрузка на сервер...</Typography>
                        <Typography variant="body2" color="text.secondary">Не закрывайте это окно</Typography>
                    </div>

                    <Divider />

                    <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                        {isUploading ? (
                            <>
                                <CircularProgress size={32} />
                                <Typography fontSize={14} mt={2}>
                                    Загружено чанков: {sentChunks} из {totalChunks}
                                </Typography>
                                {estimatedTimeLeft !== null && (
                                    <Typography fontSize={14} mt={2} color="textDisabled">
                                        Примерное время загрузки: ~{estimatedTimeLeft} сек
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon sx={{ fontSize: 40, color: "#1976d2" }} />
                                <Typography fontSize={14} mt={2}>
                                    Загрузка завершена
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>

                <Box sx={{
                    width: 260,
                    bgcolor: "#1976d2",
                    color: "#fff",
                    p: 2,
                    fontFamily: "monospace",
                    fontSize: "12px",
                    overflowY: "scroll"
                }}>
                    <Typography variant="subtitle2" fontWeight={500} mb={1}>Консоль логов</Typography>
                    <Box>
                        {logs.map((logLine, idx) => (
                            <div key={idx}>{logLine}</div>
                        ))}
                        <div ref={logEndRef} />
                    </Box>
                </Box>
            </Box>
        </Modal >
    );
}

export default ProgressModal;
