import { Site } from "@/types";
import {
  TooltipProps,
  Tooltip,
  tooltipClasses,
  ListItem,
  Box,
  Typography,
  Divider,
  IconButton,
  Switch,
  ListItemText,
  styled,
  ListItemButton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useMonitorStore } from "./model/useMontorStore";
import { Category } from "@/entities/category/types/categories";

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0,0,0,0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
}));

interface SiteRowProps {
  site: Site;
  isActive: boolean;
  poolName?: string;
  toggleSite: (site: Site) => void;
  activeTooltipId: string | null;
  onTooltipToggle: (id: string) => void;
  uniqueKey: string;
  standalone?: boolean;
  category: Category;
}

const SiteRow = ({
  site,
  isActive,
  poolName,
  toggleSite,
  activeTooltipId,
  onTooltipToggle,
  uniqueKey,
  standalone = false,
  category,
}: SiteRowProps) => {
  const { setSelectedSite, setSelectedCategory } = useMonitorStore();
  return (
    <ListItem
      sx={{ p: 0, py: 0, height: 64 }}
      secondaryAction={
        <Box display="flex" alignItems="center">
          <LightTooltip
            open={activeTooltipId === uniqueKey}
            onClose={() => onTooltipToggle(uniqueKey)}
            placement="top"
            disableFocusListener
            disableTouchListener
            title={
              <Box className="p-2 w-64 flex flex-col gap-3">
                <Typography fontWeight={500} fontSize={18}>
                  {site.name}
                </Typography>
                <Typography color="textDisabled" fontSize={14}>
                  {site.siteType.name}
                </Typography>
                <Divider />
                <Box className="space-y-1">
                  <Box className="flex justify-between">
                    <Typography color="textDisabled" fontSize={14}>
                      Код
                    </Typography>
                    <Typography fontSize={14}>{site.code}</Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography color="textDisabled" fontSize={14}>
                      Широта
                    </Typography>
                    <Typography fontSize={14}>
                      {site.latitude.toFixed(7)}
                    </Typography>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography color="textDisabled" fontSize={14}>
                      Долгота
                    </Typography>
                    <Typography fontSize={14}>
                      {site.longtitude.toFixed(7)}
                    </Typography>
                  </Box>
                  {poolName && (
                    <Box className="flex justify-between">
                      <Typography color="textDisabled" fontSize={14}>
                        Бассейн
                      </Typography>
                      <Typography fontSize={14} className="w-32 text-end">
                        {poolName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            }
          >
            <IconButton onClick={() => onTooltipToggle(uniqueKey)}>
              <InfoIcon />
            </IconButton>
          </LightTooltip>
          <Switch
            edge="end"
            checked={isActive}
            onChange={() => toggleSite(site)}
          />
        </Box>
      }
    >
      <ListItemButton
        onClick={() => {
          setSelectedSite(site);
          setSelectedCategory(category);
        }}
        sx={{ pl: standalone ? 4 : 6, py: 0 }}
      >
        <ListItemText
          primary={
            <Typography fontSize="14px" fontWeight={500}>
              {site.name}
            </Typography>
          }
          secondary={site.siteType.name}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default SiteRow;
