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
}: CategoryGroupProps) => {
  return (
    <div>
      <ListItemButton
        sx={{ pl: standalone ? 3 : 4 }}
        onClick={() => onToggleExpand(expandedId)}
      >
        <ListItemText
          primary={<Typography fontWeight={500}>{categoryName}</Typography>}
          secondary={categoryDescription}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box className="flex gap-2 ps-8 pe-3 pt-3 pb-3">
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
              />
            ))}
        </List>
      </Collapse>
    </div>
  );
};

export default CategoryGroup;
