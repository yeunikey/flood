"use client";

import KeyIcon from "@mui/icons-material/Key";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useApiKey } from "../model/useApiKey";

export function ApiKeyCard() {
  const { apiKeyInfo, generatedKey, regenerateApiKey, canGenerate } =
    useApiKey();

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <KeyIcon color="primary" />
          <Typography variant="h6" fontWeight={500}>
            API ключ
          </Typography>
        </Stack>
        <Typography color="text.secondary">
          Viewer может открыть эту страницу, смотреть документацию и создать
          ключ. Полный ключ показывается только сразу после создания.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <Button
            variant="contained"
            onClick={regenerateApiKey}
            disabled={!canGenerate}
          >
            Создать новый API ключ
          </Button>
          <Chip
            label={
              apiKeyInfo?.preview
                ? `Текущий: ${apiKeyInfo.preview}`
                : "Ключ еще не создан"
            }
            color={apiKeyInfo?.hasApiKey ? "primary" : "default"}
            variant={apiKeyInfo?.hasApiKey ? "filled" : "outlined"}
          />
        </Stack>
        {generatedKey && (
          <Alert severity="warning">
            Сохраните ключ сейчас. Позже полный ключ нельзя будет посмотреть.
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                value={generatedKey}
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
