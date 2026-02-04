import Pool from "@/entities/pool/types/pool";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  ListItemButton,
  ListItemText,
  Typography,
  Collapse,
  Divider,
  CardActionArea,
} from "@mui/material";
import { useSpatialTiles } from "./model/useSpatialTiles";

interface PoolGroupProps {
  pool: Pool;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

const PoolGroup = ({ pool, isExpanded, onToggleExpand }: PoolGroupProps) => {
  const { activeSpatial, setActiveSpatial } = useSpatialTiles();

  return (
    <div>
      <ListItemButton
        sx={{ pl: 3 }}
        onClick={() => onToggleExpand(`pool-${pool.id}`)}
        selected={isExpanded}
      >
        <ListItemText
          primary={<Typography fontWeight={600}>{pool.name}</Typography>}
          secondary={pool.description}
        />
        {isExpanded ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        {pool.spatials.map((tile, i) => (
          <CardActionArea key={i} onClick={() => setActiveSpatial(tile)}>
            <ListItemButton
              sx={{ pl: 6 }}
              selected={activeSpatial?.id == tile.id}
            >
              <ListItemText
                primary={
                  <Typography fontSize="15px" fontWeight={500}>
                    {tile.name}
                  </Typography>
                }
                secondary={"geojson"}
              />
            </ListItemButton>
          </CardActionArea>
        ))}

        <Divider orientation="horizontal" className="py-2" />
      </Collapse>
    </div>
  );
};

export default PoolGroup;
