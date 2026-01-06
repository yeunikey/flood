import Pool from "@/entities/pool/types/pool";
import { Site } from "@/types";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { ListItemButton, ListItemText, Typography, Collapse, Box, Button, Divider } from "@mui/material";
import CategoryGroup from "./CategoryGroup";
import Layer from "@/entities/layer/types/layer";

interface PoolGroupProps {
    pool: Pool;
    layers: Layer[];
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    expandedList: string[];
    onTogglePoolAll: (enabled: boolean) => void;
    onToggleCategoryAll: (layer: Layer, pool: Pool, enabled: boolean) => void;
    activeSites: Site[];
    toggleSite: (site: Site) => void;
    activeTooltipId: string | null;
    onTooltipToggle: (id: string) => void;
}

const PoolGroup = ({
    pool,
    layers,
    isExpanded,
    onToggleExpand,
    expandedList,
    onTogglePoolAll,
    onToggleCategoryAll,
    activeSites,
    toggleSite,
    activeTooltipId,
    onTooltipToggle
}: PoolGroupProps) => {
    const poolLayers = layers.filter(l => l.sites.some(site => pool.sites.map(s => s.id).includes(site.id)));

    return (
        <div>
            <ListItemButton sx={{ pl: 3 }} onClick={() => onToggleExpand(`pool-${pool.id}`)} selected={isExpanded}>
                <ListItemText
                    primary={<Typography fontWeight={600}>{pool.name}</Typography>}
                    secondary="Бассейн"
                />
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box className="flex gap-2 ps-6 pe-3 pt-2 pb-2">
                    <Button variant="outlined" color="primary" size="small" fullWidth onClick={() => onTogglePoolAll(true)}>Вкл. все</Button>
                    <Button variant="outlined" color="error" size="small" fullWidth onClick={() => onTogglePoolAll(false)}>Выкл. все</Button>
                </Box>

                {poolLayers.map(layer => {
                    const sitesInThisPoolAndLayer = layer.sites.filter(site => pool.sites.some(s => s.id === site.id));
                    const catExpandId = `cat-${pool.id}-${layer.category.id}`;

                    return (
                        <CategoryGroup
                            key={layer.category.id}
                            categoryName={layer.category.name}
                            categoryDescription={layer.category.description}
                            sites={sitesInThisPoolAndLayer}
                            expandedId={catExpandId}
                            isExpanded={expandedList.includes(catExpandId)}
                            onToggleExpand={onToggleExpand}
                            onToggleAll={(enabled) => onToggleCategoryAll(layer, pool, enabled)}
                            activeSites={activeSites}
                            toggleSite={toggleSite}
                            poolName={pool.name}
                            activeTooltipId={activeTooltipId}
                            onTooltipToggle={onTooltipToggle}
                        />
                    );
                })}
                <Divider orientation="horizontal" className="py-2" />
            </Collapse>
        </div>
    );
};

export default PoolGroup;