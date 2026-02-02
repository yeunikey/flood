import { Fragment } from "react";
import { List, Divider } from "@mui/material";

import { usePools } from "@/entities/pool/model/usePools";
import PoolGroup from "./PoolGroup";
import Pool from "@/entities/pool/types/pool";
import { useSpatial } from "@/entities/spatial/model/useSpatial";

function SpatialItems() {
  const { pools } = usePools();
  const { spatials } = useSpatial();

  const { activePools, setActivePools } = useSpatialTiles();

  const toggleExpand = (id: string) => {
    if (!id.startsWith("pool-")) return;

    const poolId = Number(id.replace("pool-", ""));
    let newActivePools: Pool[];

    if (poolId === -1) {
      const isActive = activePools.some((p) => p.id === -1);
      newActivePools = isActive
        ? activePools.filter((p) => p.id !== -1)
        : [
            ...activePools,
            {
              id: -1,
              name: "Не входящие в бассейн",
              description: "",
              spatials: [],
              sites: [],
              geojson: { type: "FeatureCollection", features: [] },
            },
          ];
    } else {
      const pool = pools.find((p) => p.id === poolId);
      if (!pool) return;

      const isActive = activePools.some((p) => p.id === poolId);
      newActivePools = isActive
        ? activePools.filter((p) => p.id !== poolId)
        : [...activePools, pool];
    }

    setActivePools(newActivePools);
  };

  const nonEmptyPools = pools.filter(
    (p) => p.spatials && p.spatials.length > 0,
  );

  const basinPools = nonEmptyPools.filter((p) => p.description === "Бассейн");
  const otherPools = nonEmptyPools.filter((p) => p.description !== "Бассейн");

  const poolTileIds = pools.flatMap((p) => p.spatials.map((t) => t.id));
  const standaloneTiles = spatials.filter(
    (t) => !poolTileIds.includes(t.spatial.id),
  );

  return (
    <div className="w-96 h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <List dense className="pb-32!">
          {basinPools.map((pool) => (
            <PoolGroup
              key={pool.id}
              pool={pool}
              isExpanded={activePools.some((p) => p.id === pool.id)}
              onToggleExpand={toggleExpand}
            />
          ))}

          {basinPools.length > 0 && otherPools.length > 0 && (
            <Divider component="li" />
          )}

          {otherPools.map((pool) => (
            <PoolGroup
              key={pool.id}
              pool={pool}
              isExpanded={activePools.some((p) => p.id === pool.id)}
              onToggleExpand={toggleExpand}
            />
          ))}

          {(basinPools.length > 0 || otherPools.length > 0) &&
            standaloneTiles.length > 0 && <Divider component="li" />}

          {standaloneTiles.length > 0 && (
            <PoolGroup
              pool={
                {
                  id: -1,
                  name: "Не входящие в бассейн",
                  spatials: standaloneTiles.map((s) => s.spatial),
                } as Pool
              }
              isExpanded={activePools.some((p) => p.id === -1)}
              onToggleExpand={toggleExpand}
            />
          )}
        </List>
      </div>
    </div>
  );
}

export default SpatialItems;
