import { Site } from "@/types";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  Box,
  Button,
  List,
} from "@mui/material";
import SiteRow from "./SiteRow";
import { Category } from "@/entities/category/types/categories";

interface CategoryGroupProps {
  categoryName: string;
  categoryDescription?: string;
  sites: Site[];
  expandedId: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
  // Props for SiteRow
  activeSites: Site[];
  toggleSite: (site: Site) => void;
  poolName?: string;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
  standalone?: boolean;
  category: Category
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
  standalone = false,
  category
}: CategoryGroupProps) => {
  return (
    <div>
      <ListItemButton onClick={() => onToggleExpand(expandedId)}>
        <ListItemText
          sx={{ pl: standalone ? 3 : 1 }}
          primary={<Typography fontWeight={500}>{categoryName}</Typography>}
          secondary={categoryDescription}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box className="flex gap-2 ps-10 pe-3 pt-3 pb-3">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
            onClick={() => onToggleAll(true)}
          >
            Вкл. все
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            fullWidth
            onClick={() => onToggleAll(false)}
          >
            Выкл. все
          </Button>
        </Box>

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
                standalone={standalone}
                category={category}
              />
            ))}
        </List>
      </Collapse>
    </div>
  );
};

export default CategoryGroup;
