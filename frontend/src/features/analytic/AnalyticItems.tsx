import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import { usePools } from "@/entities/pool/model/usePools";
import { useLayers } from "@/entities/layer/model/useLayers";
import Layer from "@/entities/layer/types/layer";
import Site from "@/entities/site/types/site";
import PoolGroup from "./PoolGroup";
import CategoryGroup from "./CategoryGroup";
import { useMonitorSites } from "../monitor/model/useMonitorSites";
import Pool from "@/entities/pool/types/pool";

function AnalyticItems() {
  const { pools } = usePools();
  const { layers } = useLayers();
  const { activeSites, setActiveSites, activePools, setActivePools } =
    useMonitorSites();

  const [expanded, setExpanded] = useState<string[]>([]);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (id.startsWith("pool-")) {
      const poolId = Number(id.replace("pool-", ""));
      const pool = pools.find((p) => p.id === poolId);

      if (pool) {
        const isPoolActive = activePools.some((p) => p.id === poolId);
        if (isPoolActive) {
          setActivePools(activePools.filter((p) => p.id !== poolId));
        } else {
          setActivePools([...activePools, pool]);
        }
      }
    } else {
      setExpanded((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    }
  };

  const handleTooltipToggle = (id: string) => {
    setActiveTooltipId((prev) => (prev === id ? null : id));
  };

  const toggleSite = (site: Site) => {
    const isActive = activeSites.some((s) => s.id === site.id);
    if (isActive) {
      setActiveSites(activeSites.filter((s) => s.id !== site.id));
    } else {
      setActiveSites([...activeSites, site]);
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    const allSites: Site[] = [
      ...pools.flatMap((p) => p.sites),
      ...layers.flatMap((l) =>
        l.sites.filter(
          (s) => !pools.some((p) => p.sites.some((ps) => ps.id === s.id)),
        ),
      ),
    ];

    if (enabled) {
      setActiveSites(allSites);
    } else {
      setActiveSites([]);
    }
  };

  const handlePoolToggleAll = (pool: Pool, enabled: boolean) => {
    const poolSiteIds = new Set(pool.sites.map((s) => s.id));
    if (enabled) {
      const sitesToAdd = pool.sites.filter(
        (s) => !activeSites.some((active) => active.id === s.id),
      );
      setActiveSites([...activeSites, ...sitesToAdd]);
    } else {
      setActiveSites(activeSites.filter((s) => !poolSiteIds.has(s.id)));
    }
  };

  const handleCategoryToggleAll = (
    layer: Layer,
    pool: Pool,
    enabled: boolean,
  ) => {
    const targetSites = layer.sites.filter((s) =>
      pool.sites.some((ps) => ps.id === s.id),
    );
    const targetIds = new Set(targetSites.map((s) => s.id));

    if (enabled) {
      const sitesToAdd = targetSites.filter(
        (s) => !activeSites.some((active) => active.id === s.id),
      );
      setActiveSites([...activeSites, ...sitesToAdd]);
    } else {
      setActiveSites(activeSites.filter((s) => !targetIds.has(s.id)));
    }
  };

  const allPoolSiteIds = pools.flatMap((p) => p.sites.map((s) => s.id));
  const standaloneSites = layers
    .map((layer) => ({
      ...layer,
      sites: layer.sites.filter((site) => !allPoolSiteIds.includes(site.id)),
    }))
    .filter((l) => l.sites.length > 0);

  const handleStandaloneToggleAll = (layer: Layer, enabled: boolean) => {
    if (enabled) {
      const newSites = layer.sites.filter(
        (site) => !activeSites.some((s) => s.id === site.id),
      );
      setActiveSites([...activeSites, ...newSites]);
    } else {
      setActiveSites(
        activeSites.filter((s) => !layer.sites.some((ls) => ls.id === s.id)),
      );
    }
  };

  return (
    <List dense className="pb-32!">
      <Box className="flex gap-1 px-6 mb-6">
        <Button
          variant="outlined"
          color="error"
          size="small"
          fullWidth
          onClick={() => handleToggleAll(false)}
        >
          Выкл. все
        </Button>
      </Box>

      {pools.map((pool) => (
        <PoolGroup
          key={pool.id}
          pool={pool}
          layers={layers}
          isExpanded={activePools.some((p) => p.id === pool.id)}
          onToggleExpand={toggleExpand}
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
          <ListItemButton
            sx={{ pl: 3 }}
            onClick={() => toggleExpand(`standalone`)}
          >
            <ListItemText
              primary={
                <Typography fontWeight={600}>Не входят в бассейн</Typography>
              }
            />
            {expanded.includes(`standalone`) ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse
            in={expanded.includes(`standalone`)}
            timeout="auto"
            unmountOnExit
          >
            {standaloneSites.map((layer) => (
              <CategoryGroup
                key={layer.category.id}
                categoryName={layer.category.name}
                categoryDescription={layer.category.description}
                sites={layer.sites}
                expandedId={`standalone-cat-${layer.category.id}`}
                isExpanded={expanded.includes(
                  `standalone-cat-${layer.category.id}`,
                )}
                onToggleExpand={toggleExpand}
                onToggleAll={(enabled) =>
                  handleStandaloneToggleAll(layer, enabled)
                }
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

export default AnalyticItems;
