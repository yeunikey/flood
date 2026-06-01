import MenuBookIcon from "@mui/icons-material/MenuBook";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { DocPage } from "@/features/docs";

type DocsSidebarProps = {
  docs: DocPage[];
  activeDoc: string;
  onOpenDoc: (id: string) => void;
};

export function DocsSidebar({ docs, activeDoc, onOpenDoc }: DocsSidebarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRight: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
        overflow: "auto",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5" fontWeight={500}>
            Документация API
          </Typography>
        </Stack>
        <Typography color="text.secondary" fontSize={14} sx={{ mt: 1 }}>
          API только на получение информации
        </Typography>
      </Box>
      <Divider />
      <List>
        {docs.map((item) => (
          <ListItemButton
            key={item.id}
            selected={item.id === activeDoc}
            onClick={() => onOpenDoc(item.id)}
          >
            <ListItemText
              primary={item.title}
              secondary={item.description}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondaryTypographyProps={{
                sx: {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                  lineHeight: 1.35,
                },
              }}
            />
          </ListItemButton>
        ))}
        <ListItemButton
          selected={activeDoc === "viewer-paths"}
          onClick={() => onOpenDoc("viewer-paths")}
        >
          <ListItemText
            primary="Все GET пути viewer"
            secondary="Список всех путей на получение информации, доступных с правами viewer."
            primaryTypographyProps={{ fontWeight: 500 }}
            secondaryTypographyProps={{
              sx: {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                lineHeight: 1.35,
              },
            }}
          />
        </ListItemButton>
      </List>
    </Paper>
  );
}
