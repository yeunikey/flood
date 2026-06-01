import { Box, Button, Stack, Typography } from "@mui/material";
import { anchorLabels } from "@/features/docs";

type DocsTocProps = {
  activeDoc: string;
  anchors: string[];
};

export function DocsToc({ activeDoc, anchors }: DocsTocProps) {
  const links = activeDoc === "viewer-paths" ? ["request"] : anchors;

  return (
    <Box sx={{ display: { xs: "none", lg: "block" } }}>
      <Box
        sx={{
          position: "sticky",
          top: 32,
          borderLeft: "1px solid",
          borderColor: "divider",
          pl: 2,
        }}
      >
        <Typography fontWeight={500} sx={{ mb: 1 }}>
          На этой странице
        </Typography>
        <Stack spacing={1}>
          {links.map((anchor) => (
            <Button
              key={anchor}
              href={activeDoc === "viewer-paths" ? undefined : `#${anchor}`}
              size="small"
              sx={{ justifyContent: "flex-start" }}
            >
              {anchorLabels[anchor] ?? "Список путей"}
            </Button>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
