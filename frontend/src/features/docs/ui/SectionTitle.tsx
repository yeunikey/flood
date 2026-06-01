import { Typography } from "@mui/material";

export function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: string;
}) {
  return (
    <Typography id={id} variant="h4" fontWeight={500} sx={{ scrollMarginTop: 24 }}>
      {children}
    </Typography>
  );
}
