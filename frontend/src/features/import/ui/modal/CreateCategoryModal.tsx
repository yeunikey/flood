import { Button, Divider, Modal, TextField, Typography } from "@mui/material";

import { useState } from "react";
import { useCategoryModal } from "../../model/modal/useCategoryModal";
import ModalBox from "@/shared/ui/el/ModalBox";
import { handleCreateCategory } from "../../model/services/categoryService";

function CreateCategoryModal() {

    const { open, setOpen } = useCategoryModal();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

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
                            Создать категорию
                        </Typography>

                        <Typography variant="body2" color="text.secondary" margin={0}>Заполните все поля ниже</Typography>
                    </div>

                    <Divider />
                </div>
                <div className="flex flex-col gap-3">
                    <TextField id="outlined-basic" label="Название" variant="outlined" size="small" value={name} onChange={(e) => setName(e.target.value)} />
                    <TextField id="outlined-basic" label="Описание" variant="outlined" size="small" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="flex justify-end">
                    <Button variant="contained"
                        onClick={() => handleCreateCategory(
                            fetching, setFetching,
                            name, description,
                            setName, setDescription,
                            setOpen
                        )}
                    >
                        Сохранить
                    </Button>
                </div>
            </ModalBox>
        </Modal>
    );
}

export default CreateCategoryModal;