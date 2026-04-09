import { Box } from "@mui/material";
import { ReactNode } from "react";

interface ModalProps {
    children?: ReactNode,
    className?: string
}

function ModalBox({ children, className }: ModalProps) {
    return (
        <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 'calc(100vw - 32px)', sm: 96 * 5 },
            maxWidth: '100vw',
            maxHeight: { xs: '90dvh', sm: 'auto' },
            overflowY: { xs: 'auto', sm: 'visible' },
            bgcolor: 'background.paper',
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }} className={className}>
            {children}
        </Box>
    );
}

export default ModalBox;