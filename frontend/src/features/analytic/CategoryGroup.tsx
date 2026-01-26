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

interface CategoryGroupProps {
  categoryName: string;
  categoryDescription?: string;
  sites: Site[];
  expandedId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
  activeSites: Site[];
  toggleSite: (site: Site) => void;
  poolName?: string;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
}

const CategoryGroup = ({
  categoryName,
  categoryDescription,
  sites,
  expandedId,
  isExpanded,
  onToggleExpand,
  onToggleAll,
  activeSites,
  toggleSite,
  poolName,
  activeTooltipId,
  onTooltipToggle,
}: CategoryGroupProps) => {
  return (
    <div>
      <ListItemButton sx={{ pl: 4 }} onClick={() => onToggleExpand(expandedId)}>
        <ListItemText
          primary={<Typography fontWeight={500}>{categoryName}</Typography>}
          secondary={categoryDescription}
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
};

export default CategoryGroup;
