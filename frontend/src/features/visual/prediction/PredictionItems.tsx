import { useLayers } from "@/entities/layer/model/useLayers";
import { usePools } from "@/entities/pool/model/usePools";
import { Typography, List, Divider } from "@mui/material";
import { useState } from "react";
import { usePredictionSites } from "./model/usePredictionSites";
import PoolGroup from "./PoolGroup";
import Site from "@/entities/site/types/site";
import CategoryGroup from "./CategoryGroup";

function PredictionItems() {
  const { pools } = usePools();
  const { layers } = useLayers();
  const { activeSite, setActiveSite, activePools, setActivePools } =
    usePredictionSites();

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
    if (activeSite?.id === site.id) {
      setActiveSite(null);
    } else {
      setActiveSite(site);
    }
  };

  const allPoolSiteIds = pools.flatMap((p) => p.sites.map((s) => s.id));
  const standaloneSites = layers
    .map((layer) => ({
      ...layer,
      sites: layer.sites.filter((site) => !allPoolSiteIds.includes(site.id)),
    }))
    .filter((l) => l.sites.length > 0);

  const validPools = pools
    .filter((p) => p.sites.length > 0)
    .sort((a, b) => (a.description || "").localeCompare(b.description || ""));

  const basinPools = validPools.filter((p) => p.description === "Бассейн");
  const otherPools = validPools.filter((p) => p.description !== "Бассейн");

  return (
    <div className="flex flex-col h-full">
      <div className="pt-3 flex flex-col min-h-0">
        <Typography
          variant="overline"
          gutterBottom
          sx={{ display: "block" }}
          fontWeight={500}
          className="text-neutral-500 pl-3"
        >
          Список точек
        </Typography>

        <div className="flex-1 min-h-0 overflow-y-scroll">
          <List dense className="pb-32!">
            {basinPools.map((pool) => (
              <PoolGroup
                key={pool.id}
                pool={pool}
                layers={layers}
                isExpanded={activePools.some((p) => p.id === pool.id)}
                onToggleExpand={toggleExpand}
                expandedList={expanded}
                onExpandGroup={toggleExpand}
                activeSite={activeSite}
                toggleSite={toggleSite}
                activeTooltipId={activeTooltipId}
                onTooltipToggle={handleTooltipToggle}
              />
            ))}

            {basinPools.length > 0 && otherPools.length > 0 && (
              <Divider component="li" />
            )}

            {otherPools.map((pool) => (
              <PoolGroup
                key={pool.id}
                pool={pool}
                layers={layers}
                isExpanded={activePools.some((p) => p.id === pool.id)}
                onToggleExpand={toggleExpand}
                expandedList={expanded}
                onExpandGroup={toggleExpand}
                activeSite={activeSite}
                toggleSite={toggleSite}
                activeTooltipId={activeTooltipId}
                onTooltipToggle={handleTooltipToggle}
              />
            ))}

            {(basinPools.length > 0 || otherPools.length > 0) &&
              standaloneSites.length > 0 && <Divider component="li" />}

            {standaloneSites.length > 0 && (
              <div>
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
                    activeSite={activeSite}
                    toggleSite={toggleSite}
                    activeTooltipId={activeTooltipId}
                    onTooltipToggle={handleTooltipToggle}
                  />
                ))}
              </div>
            )}
          </List>
        </div>
      </div>
    </div>
  );
}

export default PredictionItems;
