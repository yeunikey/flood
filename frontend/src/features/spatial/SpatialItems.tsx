import { List } from "@mui/material";

import { usePools } from "@/entities/pool/model/usePools";
import PoolGroup from "./PoolGroup";
import { useSpatialTiles } from "./model/useSpatialTiles";
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

  const poolTileIds = pools.flatMap((p) => p.spatials.map((t) => t.id));
  const standaloneTiles = spatials.filter((t) => !poolTileIds.includes(t.spatial.id));

  return (
    <div className="w-96 h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <List dense className="pb-32!">
          {nonEmptyPools.map((pool) => (
            <PoolGroup
              key={pool.id}
              pool={pool}
              isExpanded={activePools.some((p) => p.id === pool.id)}
              onToggleExpand={toggleExpand}
            />
          ))}

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
