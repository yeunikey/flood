import { Button, Divider, Modal, TextField, Typography } from "@mui/material";

import { useState } from "react";
import ModalBox from "@/shared/ui/el/ModalBox";
import { handleCreateSource } from "../../model/services/sourceService";
import { useSourceModal } from "../../model/modal/useSourceModal";

function CreateSourceModal() {

    const { open, setOpen } = useSourceModal();
    const [name, setName] = useState('');

    const [fetching, setFetching] = useState(false);

    return (
        <Modal
            open={open}
            onClose={() => {
                setOpen(false)
            }}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <ModalBox>
                <div className="flex flex-col gap-2">
                    <div>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Создать источник
                        </Typography>

                        <Typography variant="body2" color="text.secondary" margin={0}>Заполните все поля ниже</Typography>
                    </div>

                    <Divider />
                </div>
                <div className="flex flex-col gap-3">
                    <TextField id="outlined-basic" label="Название" variant="outlined" size="small" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="flex justify-end">
                    <Button variant="contained" onClick={() => handleCreateSource(fetching, setFetching, name)}>Сохранить</Button>
                </div>
            </ModalBox>
        </Modal>
    );
}

export default CreateSourceModal;