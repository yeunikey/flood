"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button } from "@mui/material";
import { toast } from "react-toastify";

export function CodeBlock({ value }: { value: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success("Скопировано");
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Button
        size="small"
        onClick={copy}
        sx={{
          position: "absolute",
          right: 10,
          top: 10,
          minWidth: 32,
          color: "#dbeafe",
          borderColor: "rgba(219,234,254,.28)",
        }}
        variant="outlined"
      >
        <ContentCopyIcon fontSize="small" />
      </Button>
      <Box
        component="pre"
        sx={{
          bgcolor: "#101923",
          color: "#e6edf3",
          borderRadius: 1,
          p: 3,
          pr: 7,
          overflow: "auto",
          fontSize: 13,
          lineHeight: 1.65,
          m: 0,
        }}
      >
        <code>{value}</code>
      </Box>
    </Box>
  );
}
