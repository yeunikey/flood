import { Button, Divider, Modal, TextField, Typography } from "@mui/material";

import ModalBox from "@/shared/ui/el/ModalBox";
import { useState } from "react";
import { useAuth } from "../model/useAuth";
import { handleCode } from "../model/authService";


function CodeModal() {
    const [code, setCode] = useState('');
    const { modal, setModal, login: email } = useAuth();

    return (
        <Modal
            open={modal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <ModalBox>
                <div className="flex flex-col gap-2">
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Подтверждение аккаунта
                    </Typography>

                    <Typography variant="body2" color="text.secondary" margin={0}>{'Введите код из почты ' + email + ' ниже'}</Typography>

                    <Divider />
                </div>
                <div className="flex flex-col gap-3">
                    <TextField id="outlined-basic" value={code} onChange={(e) => setCode(e.target.value)} label="Код" variant="outlined" size="small" />
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outlined" color="error" onClick={() => setModal(false)} disableElevation>Отменить</Button>
                    <Button variant="contained" onClick={() => handleCode(code)} disableElevation>Подтвердить</Button>
                </div>
            </ModalBox>
        </Modal>
    );
}

export default CodeModal;