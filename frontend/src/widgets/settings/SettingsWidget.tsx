import { Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, Modal, Typography } from "@mui/material";
import ModalBox from "@/shared/ui/el/ModalBox";
import { useSettings } from "../../features/settings/model/useSettings";
import { useState } from "react";
import MapIcon from '@mui/icons-material/Map';
import SecurityIcon from '@mui/icons-material/Security';
import ImageIcon from '@mui/icons-material/Image';
import MapSettings from "@/features/settings/MapSettings";
import SecuritySettings from "@/features/settings/SecuritySettings";
import ImageSettings from "@/features/settings/ImageSettings";

type SettingsCategory = "map" | "security" | "image";

function SettingsWidget() {

    const { openSettings, setOpenSettings } = useSettings();
    const [active, setActive] = useState<SettingsCategory>("map");

    return (
        <Modal open={openSettings} onClose={() => setOpenSettings(false)}>
            <ModalBox className="relative w-4xl! h-148 overflow-hidden">
                <div className="flex flex-col gap-2">
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Настройки
                    </Typography>

                    <Divider />
                </div>

                <div className="h-full w-full flex gap-6">
                    <div className="min-w-72 space-y-1">
                        <ListItem disablePadding>
                            <ListItemButton
                                className="rounded-2xl!"
                                selected={active === "map"}
                                onClick={() => setActive("map")}
                            >
                                <ListItemIcon>
                                    <MapIcon color={active === "map" ? "primary" : "inherit"} />
                                </ListItemIcon>

                                <ListItemText
                                    primary="Карта"
                                    secondary="Проекция, стили"
                                />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton
                                className="rounded-2xl!"
                                selected={active === "security"}
                                onClick={() => setActive("security")}
                            >
                                <ListItemIcon>
                                    <SecurityIcon color={active === "security" ? "primary" : "inherit"} />
                                </ListItemIcon>

                                <ListItemText
                                    primary="Безопасность"
                                    secondary="Пароли и почта"
                                />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton
                                className="rounded-2xl!"
                                selected={active === "image"}
                                onClick={() => setActive("image")}
                            >
                                <ListItemIcon>
                                    <ImageIcon color={active === "image" ? "primary" : "inherit"} />
                                </ListItemIcon>

                                <ListItemText
                                    primary="Изображение"
                                    secondary="Изображение профиля"
                                />
                            </ListItemButton>
                        </ListItem>
                    </div>

                    <div className="h-full w-full flex flex-col gap-6 overflow-y-scroll pb-64">
                        {active == "map" && (<MapSettings />)}
                        {active == "security" && (<SecuritySettings />)}
                        {active == "image" && (<ImageSettings />)}
                    </div>
                </div>
            </ModalBox>
        </Modal>
    );
}

export default SettingsWidget;
