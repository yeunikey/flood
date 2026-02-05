import Pool from "@/entities/pool/types/pool";
import { Site } from "@/types";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  Divider,
} from "@mui/material";
import Layer from "@/entities/layer/types/layer";
import CategoryGroup from "./CategoryGroup";

interface PoolGroupProps {
  pool: Pool;
  layers: Layer[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  expandedList: string[];
  onExpandGroup: (id: string) => void;
  activeSite: Site | null;
  toggleSite: (site: Site) => void;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
}

const PoolGroup = ({
  pool,
  layers,
  isExpanded,
  onToggleExpand,
  expandedList,
  onExpandGroup,
  activeSite,
  toggleSite,
  activeTooltipId,
  onTooltipToggle,
}: PoolGroupProps) => {
  const poolLayers = layers.filter((l) =>
    l.sites.some((site) => pool.sites.map((s) => s.id).includes(site.id)),
  );

  return (
    <div>
      <ListItemButton
        sx={{ pl: 3 }}
        onClick={() => onToggleExpand(`pool-${pool.id}`)}
      >
        <ListItemText
          primary={<Typography fontWeight={600}>{pool.name}</Typography>}
          secondary={pool.description}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {poolLayers.map((layer) => {
          const sitesInThisPoolAndLayer = layer.sites.filter((site) =>
            pool.sites.some((s) => s.id === site.id),
          );
          const catExpandId = `cat-${pool.id}-${layer.category.id}`;

          return (
            <CategoryGroup
              key={layer.category.id}
              category={layer.category}
              sites={sitesInThisPoolAndLayer}
              expandedId={catExpandId}
              isExpanded={expandedList.includes(catExpandId)}
              onToggleExpand={onExpandGroup}
              activeSite={activeSite}
              toggleSite={toggleSite}
              poolName={pool.name}
              activeTooltipId={activeTooltipId}
              onTooltipToggle={onTooltipToggle}
            />
          );
        })}
        <Divider orientation="horizontal" className="py-2" />
      </Collapse>
    </div>
  );
};

export default PoolGroup;
