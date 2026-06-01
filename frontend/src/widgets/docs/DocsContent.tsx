import { Box, Stack } from "@mui/material";
import {
  ApiKeyCard,
  DocArticle,
  ViewerPathsTable,
  type DocPage,
} from "@/features/docs";

type DocsContentProps = {
  activeDoc: string;
  doc: DocPage;
};

export function DocsContent({ activeDoc, doc }: DocsContentProps) {
  return (
    <Stack spacing={6} sx={{ minWidth: 0 }}>
      <ApiKeyCard />
      <Box>
        {activeDoc === "viewer-paths" ? (
          <ViewerPathsTable />
        ) : (
          <DocArticle doc={doc} />
        )}
      </Box>
    </Stack>
  );
}
