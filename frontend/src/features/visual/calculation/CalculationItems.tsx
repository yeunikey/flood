import CardActionArea from "@mui/material/CardActionArea";
import {
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useCalculationStore } from "./model/useCalculationStore";
import Pool from "@/entities/pool/types/pool";
import { usePools } from "@/entities/pool/model/usePools";
import { Calculation, calculations } from "./model/calculations";
import { useCalculationMap } from "./model/useCalculationMap";

function CalculationItems() {
  const { pools } = usePools();
  const {
    activeCalculation,
    activePools,
    setActiveCalculations,
    setActivePools,
  } = useCalculationStore();
  const { map } = useCalculationMap();

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
            } as Pool,
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

  const handleCalculationClick = (item: Calculation) => {
    setActiveCalculations(item);
    if (map && item.latitude && item.longitude) {
      map.flyTo({
        center: [item.longitude, item.latitude],
        zoom: 12,
        essential: true,
      });
    }
  };

  const poolSiteCodes = new Set(
    pools.flatMap((p) => p.sites?.map((s) => s.code) || []),
  );
  const standaloneCalculations = calculations.filter(
    (h) => !poolSiteCodes.has(h.site_code),
  );

  const validPools = pools.filter((p) =>
    calculations.some((calc) =>
      p.sites?.some((s) => s.code === calc.site_code),
    ),
  );

  const basinPools = validPools.filter((p) => p.description === "Бассейн");
  const otherPools = validPools.filter((p) => p.description !== "Бассейн");

  const renderItem = (item: Calculation) => (
    <CardActionArea key={item.id} onClick={() => handleCalculationClick(item)}>
      <ListItemButton
        selected={item.id === activeCalculation?.id}
        sx={{ pl: 4 }}
      >
        <ListItemText
          primary={
            <Typography fontSize="15px" fontWeight={500}>
              {item.name}
            </Typography>
          }
          secondary="Гидропост"
        />
      </ListItemButton>
    </CardActionArea>
  );

  const renderPool = (pool: Pool) => {
    const isExpanded = activePools.some((p) => p.id === pool.id);
    const poolItems = calculations.filter((h) =>
      pool.sites?.some((s) => s.code === h.site_code),
    );

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
            {poolItems.map(renderItem)}
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
            <Divider sx={{ my: 1 }} />
            <Typography
              variant="overline"
              sx={{ px: 2, mt: 2, display: "block", color: "text.secondary" }}
            >
              Другие
            </Typography>
            {otherPools.map(renderPool)}
          </>
        )}

        {standaloneCalculations.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
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
                {standaloneCalculations.map(renderItem)}
              </List>
            </Collapse>
          </>
        )}
      </div>
    </div>
  );
}

export default CalculationItems;