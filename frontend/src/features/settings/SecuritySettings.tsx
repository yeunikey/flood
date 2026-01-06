import { Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { changePassword } from "./model/settings";

function SecuritySettings() {

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <Typography variant="h6" fontWeight={500}>
                    Смена пароля
                </Typography>

                <div className="space-y-3!">
                    <div className="space-y-2!">
                        <TextField
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            label="Старый пароль"
                            type="password"
                            className="w-full"
                            variant="outlined"
                            size="small"
                        ></TextField>

                        <TextField
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            label="Новый пароль"
                            type="password"
                            className="w-full"
                            variant="outlined"
                            size="small"
                        ></TextField>

                        <TextField
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            label="Повтор пароля"
                            type="password"
                            className="w-full"
                            variant="outlined"
                            size="small"
                        ></TextField>
                    </div>
                </div>

                <Button
                    variant="contained"
                    className="mt-3! w-fit"
                    onClick={() => changePassword(oldPassword, newPassword, repeatPassword)}
                    disableElevation
                >
                    Сохранить
                </Button>
            </div>
        </div >
    );
}

export default SecuritySettings;