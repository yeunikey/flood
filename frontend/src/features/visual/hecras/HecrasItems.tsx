import { useHecRas } from "@/entities/hec-ras/model/useHecRas";
import CardActionArea from "@mui/material/CardActionArea";
import {
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useHecrasStore } from "./model/useHecrasStore";
import Pool from "@/entities/pool/types/pool";
import { usePools } from "@/entities/pool/model/usePools";
import HecRas from "@/entities/hec-ras/types/hec-ras";

function HecrasItems() {
  const { hecRas } = useHecRas();
  const { pools } = usePools();
  const { activeHecras, setActiveHecras, activePools, setActivePools } =
    useHecrasStore();

  const toggleExpand = (id: string) => {
    const poolId = id === "standalone" ? -1 : Number(id.replace("pool-", ""));
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

  const poolHecRasIds = new Set(pools.flatMap((p) => p.hecRasIds || []));
  const standaloneHecRas = hecRas.filter((h) => !poolHecRasIds.has(h.id));

  const basinPools = pools.filter(
    (p) => p.description === "Бассейн" && p.hecRasIds?.length > 0,
  );
  const otherPools = pools.filter(
    (p) => p.description !== "Бассейн" && p.hecRasIds?.length > 0,
  );

  const renderHecRasItem = (item: HecRas) => (
    <CardActionArea key={item.id} onClick={() => setActiveHecras(item)}>
      <ListItemButton selected={item.id === activeHecras?.id} sx={{ pl: 4 }}>
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
  );

  const renderPool = (pool: Pool) => {
    const isExpanded = activePools.some((p) => p.id === pool.id);
    const poolItems = hecRas.filter((h) => pool.hecRasIds?.includes(h.id));

    if (poolItems.length === 0) return null;

    return (
      <div key={pool.id}>
        <ListItemButton onClick={() => toggleExpand(`pool-${pool.id}`)}>
          <ListItemText
            primary={<Typography fontWeight={600}>{pool.name}</Typography>}
            secondary={pool.description}
          />
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {poolItems.map(renderHecRasItem)}
          </List>
        </Collapse>
      </div>
    );
  };

  return (
    <div className="w-96 h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {basinPools.length > 0 && (
          <>
            <Typography
              variant="overline"
              gutterBottom
              sx={{ display: "block" }}
              fontWeight={500}
              className="text-neutral-500 pl-3 pt-2"
            >
              список бассейнов
            </Typography>
            {basinPools.map(renderPool)}
          </>
        )}

        {otherPools.length > 0 && (
          <>
            <Typography
              variant="overline"
              sx={{ px: 2, mt: 2, display: "block", color: "text.secondary" }}
            >
              Другие
            </Typography>
            {otherPools.map(renderPool)}
          </>
        )}

        {standaloneHecRas.length > 0 && (
          <>
            <ListItemButton onClick={() => toggleExpand("standalone")}>
              <ListItemText
                primary={
                  <Typography fontSize="15px" fontWeight={600}>
                    Не входящие в бассейн
                  </Typography>
                }
              />
              {activePools.some((p) => p.id === -1) ? (
                <ExpandLess />
              ) : (
                <ExpandMore />
              )}
            </ListItemButton>
            <Collapse
              in={activePools.some((p) => p.id === -1)}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {standaloneHecRas.map(renderHecRasItem)}
              </List>
            </Collapse>
          </>
        )}
      </div>
    </div>
  );
}

export default HecrasItems;
