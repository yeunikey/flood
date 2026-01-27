import { Site } from "@/types";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  List,
} from "@mui/material";
import SiteRow from "./SiteRow";
import { Category } from "@/entities/category/types/categories";

interface CategoryGroupProps {
  category: Category;
  sites: Site[];
  expandedId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  activeSites: Site[];
  toggleSite: (category: Category, site: Site) => void;
  poolName?: string;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
}

function CategoryGroup({
  category,
  sites,
  expandedId,
  isExpanded,
  onToggleExpand,
  activeSites,
  toggleSite,
  poolName,
  activeTooltipId,
  onTooltipToggle,
}: CategoryGroupProps) {
  return (
    <div>
      <ListItemButton sx={{ pl: 4 }} onClick={() => onToggleExpand(expandedId)}>
        <ListItemText
          primary={<Typography fontWeight={500}>{category.name}</Typography>}
          secondary={category.description}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {sites
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((site) => (
              <SiteRow
                key={`${expandedId}-${site.id}`}
                category={category}
                uniqueKey={`${expandedId}-${site.id}`}
                site={site}
                isActive={activeSites.some((s) => s.id === site.id)}
                toggleSite={toggleSite}
                poolName={poolName}
                activeTooltipId={activeTooltipId}
                onTooltipToggle={onTooltipToggle}
              />
            ))}
        </List>
      </Collapse>
    </div>
  );
}

export default CategoryGroup;