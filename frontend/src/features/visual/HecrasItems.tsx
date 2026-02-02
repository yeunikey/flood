import { useHecRas } from "@/entities/hec-ras/model/useHecRas";
import CardActionArea from "@mui/material/CardActionArea";
import { ListItemButton, ListItemText, Typography } from "@mui/material";
import { useHecrasStore } from "./model/useHecrasStore";
import Pool from "@/entities/pool/types/pool";
import { usePools } from "@/entities/pool/model/usePools";

function HecrasItems() {
  const { hecRas } = useHecRas();

  const { pools } = usePools();
  const { activeHecras, setActiveHecras, activePools, setActivePools } =
    useHecrasStore();

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
              hecRasIds: [],
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
  const standaloneHecRas = hecRas.filter(
    (t) => !poolTileIds.includes(t.spatial.id),
  );

  return (
    <div className="w-96 h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {hecRas.map((item, i) => (
          <CardActionArea key={i} onClick={() => setActiveHecras(item)}>
            <ListItemButton selected={item?.id == activeHecras?.id}>
              <ListItemText
                primary={
                  <Typography fontSize="15px" fontWeight={500}>
                    {item.name}
                  </Typography>
                }
                secondary={"HEC-RAS"}
              />
            </ListItemButton>
          </CardActionArea>
        ))}
      </div>
    </div>
  );
}

export default HecrasItems;
