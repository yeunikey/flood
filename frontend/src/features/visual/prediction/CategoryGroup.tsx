import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import SiteRow from "./SiteRow";
import { Site } from "@/types";
import { Category } from "@/entities/category/types/categories";

interface CategoryGroupProps {
  category?: Category;
  categoryName?: string;
  categoryDescription?: string;
  sites: Site[];
  expandedId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  activeSite: Site | null;
  toggleSite: (site: Site) => void;
  poolName?: string;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
}

const CategoryGroup = ({
  category,
  categoryName,
  categoryDescription,
  sites,
  expandedId,
  isExpanded,
  onToggleExpand,
  activeSite,
  toggleSite,
  poolName,
  activeTooltipId,
  onTooltipToggle,
}: CategoryGroupProps) => {
  const name = category?.name || categoryName || "";
  const desc = category?.description || categoryDescription || "";

  return (
    <>
      <ListItemButton
        sx={{ pl: 4 }}
        onClick={() => onToggleExpand(expandedId)}
      >
        <ListItemText
          primary={<Typography fontWeight={500}>{name}</Typography>}
          secondary={desc}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {sites.map((site) => (
          <SiteRow
            key={site.id}
            uniqueKey={`${expandedId}-site-${site.id}`}
            site={site}
            isActive={activeSite?.id === site.id}
            toggleSite={toggleSite}
            poolName={poolName}
            activeTooltipId={activeTooltipId}
            onTooltipToggle={onTooltipToggle}
            standalone={!poolName}
          />
        ))}
      </Collapse>
    </>
  );
};

export default CategoryGroup;
