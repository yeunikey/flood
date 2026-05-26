import WrongLocationIcon from "@mui/icons-material/WrongLocation";
import { Box, Typography } from "@mui/material";

type Props = {
  title: string;
  description: string;
};

export default function ForecastPlaceholder({ title, description }: Props) {
  return (
    <Box
      minHeight={360}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1}
      px={3}
      textAlign="center"
    >
      <WrongLocationIcon sx={{ fontSize: 48, mb: 1, color: "text.secondary" }} />
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}
