import { Grid, List } from "@mui/material";

import { usePools } from "@/entities/pool/model/usePools";
import { useTiles } from "@/entities/tiles/model/useTiles";
import PoolGroup from "./PoolGroup";
import { useSpatialTiles } from "./model/useSpatialTiles";
import Pool from "@/entities/pool/types/pool";

function SpatialItems() {

    const { pools } = usePools();
    const { tiles } = useTiles();

    const { activePools, setActivePools } = useSpatialTiles();

    const toggleExpand = (id: string) => {
        if (!id.startsWith('pool-')) return;

        const poolId = Number(id.replace('pool-', ''));
        let newActivePools: Pool[];

        if (poolId === -1) {
            const isActive = activePools.some(p => p.id === -1);
            newActivePools = isActive
                ? activePools.filter(p => p.id !== -1)
                : [...activePools, {
                    id: -1,
                    name: "Не входящие в бассейн",
                    tiles: [],
                    sites: [],
                    geojson: { type: "FeatureCollection", features: [] }
                }];
        } else {
            const pool = pools.find(p => p.id === poolId);
            if (!pool) return;

            const isActive = activePools.some(p => p.id === poolId);
            newActivePools = isActive
                ? activePools.filter(p => p.id !== poolId)
                : [...activePools, pool];
        }

        setActivePools(newActivePools);
    };

    // Фильтруем бассейны с тайлами
    const nonEmptyPools = pools.filter(p => p.tiles && p.tiles.length > 0);

    // Тайлы, не входящие в бассейн
    const poolTileIds = pools.flatMap(p => p.tiles.map(t => t.id));
    const standaloneTiles = tiles.filter(t => !poolTileIds.includes(t.id));

    return (
        <div className="w-96 h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto">
                <List dense className="pb-32!">

                    {nonEmptyPools.map(pool => (
                        <PoolGroup
                            key={pool.id}
                            pool={pool}
                            isExpanded={activePools.some(p => p.id === pool.id)}
                            onToggleExpand={toggleExpand}
                        />
                    ))}

                    {standaloneTiles.length > 0 && (
                        <PoolGroup
                            pool={{
                                id: -1,
                                name: "Не входящие в бассейн",
                                tiles: standaloneTiles
                            } as Pool}
                            isExpanded={activePools.some(p => p.id === -1)}
                            onToggleExpand={toggleExpand}
                        />
                    )}
                </List>
            </div>
        </div>
    );
}

export default SpatialItems;