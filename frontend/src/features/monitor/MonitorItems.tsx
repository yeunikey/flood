import { useState } from "react";
import { Box, Button, Collapse, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import { usePools } from "@/entities/pool/model/usePools";
import { useLayers } from "@/entities/layer/model/useLayers";
import Pool from "@/entities/pool/types/pool";
import Layer from "@/entities/layer/types/layer";
import Site from "@/entities/site/types/site";
import { useMonitorSites } from "./model/useMonitorSites";
import PoolGroup from "./PoolGroup";
import CategoryGroup from "./CategoryGroup";
import { Geometry } from "geojson";
import { useMonitorMap } from "./model/useMonitorMap";

function MonitorItems() {
    const { pools } = usePools();
    const { layers } = useLayers();
    const {
        activeSites, setActiveSites,
        activePools, setActivePools
    } = useMonitorSites();
    const { map } = useMonitorMap();

    const [expanded, setExpanded] = useState<string[]>([]);
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

    const centerToPool = (pool: Pool) => {
        if (!map) return;
        if (pool.geojson.type === "FeatureCollection" && pool.geojson.features.length > 0) {
            const coords: number[][] = [];
            pool.geojson.features.forEach((f) => {
                const g: Geometry | null = f.geometry;

                if (!g) return;
                switch (g.type) {
                    case "Point":
                        coords.push(g.coordinates);
                        break;
                    case "LineString":
                        coords.push(...g.coordinates);
                        break;
                    case "Polygon":
                        coords.push(...g.coordinates.flat());
                        break;
                    case "MultiPolygon":
                        (g.coordinates as number[][][][]).forEach(p => coords.push(...p.flat()));
                        break;
                }
            });

            if (coords.length) {
                const lons = coords.map(c => c[0]);
                const lats = coords.map(c => c[1]);
                const bounds: [[number, number], [number, number]] = [
                    [Math.min(...lons), Math.min(...lats)],
                    [Math.max(...lons), Math.max(...lats)],
                ];
                map.fitBounds(bounds, { padding: 20 });
            }
        }
    }

    const toggleExpand = (id: string) => {
        if (id.startsWith('pool-')) {
            const poolId = Number(id.replace('pool-', ''));
            const pool = pools.find(p => p.id === poolId);

            if (pool) {
                const isPoolActive = activePools.some(p => p.id === poolId);
                if (isPoolActive) {
                    setActivePools(activePools.filter(p => p.id !== poolId));
                } else {
                    setActivePools([...activePools, pool]);
                    centerToPool(pool);
                }
            }
        }
        else {
            setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        }
    };

    const handleTooltipToggle = (id: string) => {
        setActiveTooltipId(prev => (prev === id ? null : id));
    };

    const isActive = (siteId: number) => activeSites.some(s => s.id === siteId);

    const toggleSite = (site: Site) => {
        if (isActive(site.id)) {
            setActiveSites(activeSites.filter(s => s.id !== site.id));
        } else {
            setActiveSites([...activeSites, site]);
        }
    };

    const handlePoolToggleAll = (pool: Pool, enabled: boolean) => {
        if (enabled) {
            const newSites = pool.sites.filter(site => !isActive(site.id));
            setActiveSites([...activeSites, ...newSites]);
        } else {
            setActiveSites(activeSites.filter(site => !pool.sites.some(s => s.id === site.id)));
        }
    };

    const handleCategoryToggleAll = (layer: Layer, pool: Pool, enabled: boolean) => {
        const sitesInPool = layer.sites.filter(site => pool.sites.some(s => s.id === site.id));
        if (enabled) {
            const newSites = sitesInPool.filter(site => !isActive(site.id));
            setActiveSites([...activeSites, ...newSites]);
        } else {
            setActiveSites(activeSites.filter(site => !sitesInPool.some(s => s.id === site.id)));
        }
    };

    const handleToggleAll = (enabled: boolean) => {
        const allSites: Site[] = [
            ...pools.flatMap(p => p.sites),
            ...layers.flatMap(l => l.sites.filter(s => !pools.some(p => p.sites.some(ps => ps.id === s.id))))
        ];

        if (enabled) {
            setActiveSites(allSites);
        } else {
            setActiveSites([]);
        }
    };

    const allPoolSiteIds = pools.flatMap(p => p.sites.map(s => s.id));
    const standaloneSites = layers.map(layer => ({
        ...layer,
        sites: layer.sites.filter(site => !allPoolSiteIds.includes(site.id))
    })).filter(l => l.sites.length > 0);

    const handleStandaloneToggleAll = (layer: Layer, enabled: boolean) => {
        if (enabled) {
            const newSites = layer.sites.filter(site => !activeSites.some(s => s.id === site.id));
            setActiveSites([...activeSites, ...newSites]);
        } else {
            setActiveSites(activeSites.filter(s => !layer.sites.some(ls => ls.id === s.id)));
        }
    };

    return (
        <List dense className="pb-32!">
            <Box className="flex gap-2 px-6 mb-6">
                <Button variant="outlined" color="primary" size="small" fullWidth onClick={() => handleToggleAll(true)}>Вкл. все</Button>
                <Button variant="outlined" color="error" size="small" fullWidth onClick={() => handleToggleAll(false)}>Выкл. все</Button>
            </Box>

            {pools.map(pool => (
                <PoolGroup
                    key={pool.id}
                    pool={pool}
                    layers={layers}
                    // Здесь используем activePools для определения раскрытия
                    isExpanded={activePools.some(p => p.id === pool.id)}
                    onToggleExpand={toggleExpand}
                    // Для дочерних элементов (категорий) используем локальный стейт
                    expandedList={expanded}
                    onTogglePoolAll={(enabled) => handlePoolToggleAll(pool, enabled)}
                    onToggleCategoryAll={handleCategoryToggleAll}
                    activeSites={activeSites}
                    toggleSite={toggleSite}
                    activeTooltipId={activeTooltipId}
                    onTooltipToggle={handleTooltipToggle}
                />
            ))}

            {standaloneSites.length > 0 && (
                <div>
                    <ListItemButton sx={{ pl: 3 }} onClick={() => toggleExpand(`standalone`)}>
                        <ListItemText primary={<Typography fontWeight={600}>Не входят в бассейн</Typography>} />
                        {expanded.includes(`standalone`) ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={expanded.includes(`standalone`)} timeout="auto" unmountOnExit>
                        {standaloneSites.map(layer => (
                            <CategoryGroup
                                key={layer.category.id}
                                categoryName={layer.category.name}
                                categoryDescription={layer.category.description}
                                sites={layer.sites}
                                expandedId={`standalone-cat-${layer.category.id}`}
                                isExpanded={expanded.includes(`standalone-cat-${layer.category.id}`)}
                                onToggleExpand={toggleExpand}
                                onToggleAll={(enabled) => handleStandaloneToggleAll(layer, enabled)}
                                activeSites={activeSites}
                                toggleSite={toggleSite}
                                poolName={undefined}
                                activeTooltipId={activeTooltipId}
                                onTooltipToggle={handleTooltipToggle}
                            />
                        ))}
                    </Collapse>
                </div>
            )}
        </List>
    );
}

export default MonitorItems;