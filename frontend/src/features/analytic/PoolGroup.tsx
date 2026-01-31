import Pool from "@/entities/pool/types/pool";
import { Site } from "@/types";
import Layer from "@/entities/layer/types/layer";
import { Category } from "@/entities/category/types/categories";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  Divider,
} from "@mui/material";
import CategoryGroup from "./CategoryGroup";
import { SiteRecord } from "./model/useAnalyticSites";

interface PoolGroupProps {
  pool: Pool;
  layers: Layer[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedList: string[];
  onExpandGroup: (id: string) => void;
  activeSites: Record<number, SiteRecord>;
  toggleSite: (category: Category, site: Site) => void;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
}

function PoolGroup({
  pool,
  layers,
  isExpanded,
  onToggleExpand,
  expandedList,
  onExpandGroup,
  activeSites,
  toggleSite,
  activeTooltipId,
  onTooltipToggle,
}: PoolGroupProps) {
  const poolLayers = layers.filter((l) =>
    l.sites.some((site) => pool.sites.some((s) => s.id === site.id))
  );

  return (
    <div>
      <ListItemButton
        sx={{ pl: 3 }}
        onClick={onToggleExpand}
        selected={isExpanded}
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
            pool.sites.some((s) => s.id === site.id)
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
              activeSites={activeSites[layer.category.id]?.sites || []}
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
}

export default PoolGroup;