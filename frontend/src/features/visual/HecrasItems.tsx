import { useHecRas } from "@/entities/hec-ras/model/useHecRas";
import CardActionArea from "@mui/material/CardActionArea";
import { ListItemButton, ListItemText, Typography } from "@mui/material";
import { useHecrasStore } from "./model/useHecrasStore";

function HecrasItems() {
  const { hecRas } = useHecRas();
  const { activeHecras, setActiveHecras } = useHecrasStore();

  return (
    <div className="w-96 h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {hecRas.map((item, i) => (
          <CardActionArea key={i} onClick={() => setActiveHecras(item)}>
            <ListItemButton selected={item?.id == activeHecras?.id}>
              <ListItemText
                primary={
                  <Typography fontSize="15px" fontWeight={500}>
                    {item.name}
                  </Typography>
                }
                secondary={"HEC-RAS"}
              />
            </ListItemButton>
          </CardActionArea>
        ))}
      </div>
    </div>
  );
}

export default HecrasItems;
