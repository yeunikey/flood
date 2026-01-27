import { useState, useMemo, useCallback } from "react";
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
import PoolGroup from "./PoolGroup";
import CategoryGroup from "./CategoryGroup";
import { useAnalyticSites } from "./model/useAnalyticSites";
import Site from "@/entities/site/types/site";
import { Category } from "@/entities/category/types/categories";
import { fetchSite } from "./model/fetchCategory";

function AnalyticItems() {
  const { pools } = usePools();
  const { layers } = useLayers();
  const {
    activeSites,
    activePools,
    selectAll,
    clearSites,
    toggleSite,
    togglePool,
  } = useAnalyticSites();

  const [expanded, setExpanded] = useState<string[]>([]);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const handleToggleSite = (category: Category, site: Site) => {
    const isAlreadyActive = activeSites[category.id]?.sites.some(
      (s) => s.id === site.id,
    );

    toggleSite(category, site);

    if (!isAlreadyActive) {
      fetchSite(category, site);
    }
  };

  const handleTooltipToggle = useCallback((id: string) => {
    setActiveTooltipId((prev) => (prev === id ? null : id));
  }, []);

  const handleToggleAll = () => {
    if (Object.keys(activeSites).length > 0) {
      clearSites();
      return;
    }
  };

  const standaloneSites = useMemo(() => {
    const allPoolSiteIds = new Set(
      pools.flatMap((p) => p.sites.map((s) => s.id)),
    );
    return layers
      .map((layer) => ({
        ...layer,
        sites: layer.sites.filter((site) => !allPoolSiteIds.has(site.id)),
      }))
      .filter((l) => l.sites.length > 0);
  }, [pools, layers]);

  return (
    <List dense className="pb-32!">
      <Box className="flex gap-1 px-6 mb-6">
        <Button
          variant="outlined"
          color="error"
          size="small"
          fullWidth
          onClick={handleToggleAll}
        >
          {"Выкл. все"}
        </Button>
      </Box>

      {pools.map((pool) => (
        <PoolGroup
          key={pool.id}
          pool={pool}
          layers={layers}
          isExpanded={activePools.some((p) => p.id === pool.id)}
          onToggleExpand={() => togglePool(pool)}
          expandedList={expanded}
          onExpandGroup={toggleExpand}
          activeSites={activeSites}
          toggleSite={handleToggleSite}
          activeTooltipId={activeTooltipId}
          onTooltipToggle={handleTooltipToggle}
        />
      ))}

      {standaloneSites.length > 0 && (
        <div>
          <ListItemButton
            sx={{ pl: 3 }}
            onClick={() => toggleExpand("standalone")}
          >
            <ListItemText
              primary={
                <Typography fontWeight={600}>Не входят в бассейн</Typography>
              }
            />
            {expanded.includes("standalone") ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse
            in={expanded.includes("standalone")}
            timeout="auto"
            unmountOnExit
          >
            {standaloneSites.map((layer) => (
              <CategoryGroup
                key={layer.category.id}
                category={layer.category}
                sites={layer.sites}
                expandedId={`standalone-cat-${layer.category.id}`}
                isExpanded={expanded.includes(
                  `standalone-cat-${layer.category.id}`,
                )}
                onToggleExpand={toggleExpand}
                activeSites={activeSites[layer.category.id]?.sites || []}
                toggleSite={handleToggleSite}
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
