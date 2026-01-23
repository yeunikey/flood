import { Modal, Checkbox, Button, Divider, Typography, FormControlLabel } from "@mui/material";
import ModalBox from "@/shared/ui/el/ModalBox"; // Убедитесь, что путь верный
import { useDisabledVariables } from "../model/useDisabledVariables";

interface Variable {
    id: number;
    name: string;
}

interface VariablesSettingsModalProps {
    open: boolean;
    onClose: () => void;
    variables: Variable[];
}

export default function VariablesSettingsModal({ open, onClose, variables }: VariablesSettingsModalProps) {
    const { disabledVariables, toggleVariable } = useDisabledVariables();

    return (
        <Modal open={open} onClose={onClose}>
            <ModalBox className="relative w-xl! overflow-hidden flex flex-col max-h-[60vh]">

                <Typography variant="h6" className="mb-4">
                    Настройка отображения переменных
                </Typography>

                <Divider className="my-4" />

                <div className="overflow-y-auto flex-1 pr-2">
                    {variables.length > 0 ? (
                        variables.map((v) => (
                            <div key={v.id} className="block">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!disabledVariables.includes(v.id)}
                                            onChange={() => toggleVariable(v.id)}
                                        />
                                    }
                                    label={v.name}
                                />
                            </div>
                        ))
                    ) : (
                        <Typography color="text.secondary">Нет доступных переменных</Typography>
                    )}
                </div>

                <Divider className="my-4" />

                <div className="flex justify-end gap-2">
                    <Button variant="contained" onClick={onClose}>
                        Готово
                    </Button>
                </div>
            </ModalBox>
        </Modal>
    );
}