import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useSettings } from "./model/useSettings";
import { PROJECTIONS } from "./model/projections";
import Image from "next/image";
import { STYLES } from "./model/styles";

function MapSettings() {
    const {
        projection, setProjection,
        style, setStyle
    } = useSettings();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <Typography variant="h6" fontWeight={500}>
                    Проекция
                </Typography>

                <List className="space-y-2!">
                    {PROJECTIONS.map((item) => (
                        <ListItemButton
                            key={item.value}
                            selected={projection === item.value}
                            onClick={() => setProjection(item.value)}
                            className="rounded-2xl! p-2 border! border-gray-200! flex gap-6"
                        >
                            <ListItemIcon className="min-w-24">
                                <Image
                                    src={item.image}
                                    alt={item.label}
                                    width={80}
                                    height={50}
                                    className="object-contain rounded-xl"
                                    unoptimized
                                />
                            </ListItemIcon>

                            <ListItemText
                                primary={item.label}
                                secondary={item.description}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </div>

            <div className="flex flex-col gap-2">
                <Typography variant="h6" fontWeight={500}>
                    Стилизация
                </Typography>

                <List className="space-y-2! flex gap-2">
                    {STYLES.map((item) => (
                        <ListItemButton
                            key={item.label}
                            selected={style.label === item.label}
                            onClick={() => setStyle(item)}
                            className="rounded-2xl! h-64 border! border-gray-200! flex gap-6 relative overflow-hidden"
                        >
                            <ListItemIcon className="absolute top-0 left-0 h-full w-full">
                                <Image
                                    src={item.image}
                                    alt={item.label}
                                    width={80}
                                    height={50}
                                    className="object-cover rounded-xl w-full h-full"
                                    unoptimized
                                />
                                <div className={`absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t ${style.label == item.label ? 'from-[#1976d2]' : 'from-black/70'} to-transparent`}></div>

                            </ListItemIcon>

                            <ListItemText
                                primary={<Typography variant="h5" fontWeight={500} color="white">{item.label}</Typography>}

                                className="absolute bottom-2 left-2"
                            />
                        </ListItemButton>
                    ))}
                </List>
            </div>
        </div>
    );
}

export default MapSettings;
