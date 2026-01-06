import { usePublicLayers } from "@/entities/layer/model/usePublicLayers";
import { List, ListItem, ListItemText, Switch, Typography } from "@mui/material";

function PublicLayers() {

    const { layers, toggleLayer } = usePublicLayers();

    return (
        <div className="flex flex-col gap-3">
            <List component="div" disablePadding>
                <LayerItem
                    label="Озёра и реки"
                    checked={layers.lakesRivers}
                    toggleLayer={() => toggleLayer('lakesRivers')}
                    id="lakesRivers"
                />

                <LayerItem
                    label="Границы областей"
                    checked={layers.regionBorders}
                    toggleLayer={() => toggleLayer('regionBorders')}
                    id="regionBorders"
                />
            </List>
        </div>
    );
}

type Props = {
    id: string,
    checked: boolean,
    toggleLayer: (key: string) => void,
    label: string
}

function LayerItem({ id: key, checked, toggleLayer, label }: Props) {
    return (
        <ListItem
            secondaryAction={
                <Switch
                    edge="end"
                    checked={checked}
                    onChange={() => toggleLayer(key)}
                />
            }
        >
            <ListItemText
                primary={
                    <Typography fontSize="16px" fontWeight={500}>{label}</Typography>
                }
                secondary='Слои'
            />
        </ListItem>
    )
}

export default PublicLayers;