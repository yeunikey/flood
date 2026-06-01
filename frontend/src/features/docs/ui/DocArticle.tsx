import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import {
  apiKeyHeader,
  demoApiKey,
  protoModel,
} from "../model/docs.constants";
import type { DocPage } from "../model/types";
import { CodeBlock } from "./CodeBlock";
import { ParamsTable } from "./ParamsTable";
import { SectionTitle } from "./SectionTitle";

export function DocArticle({ doc }: { doc: DocPage }) {
  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="h3" fontWeight={500}>
          {doc.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: 18 }}>
          {doc.description}
        </Typography>
      </Box>

      <Stack spacing={3}>
        <SectionTitle id="request">Запрос</SectionTitle>
        {doc.method && doc.path && (
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Chip label={doc.method} color="primary" />
            <Typography sx={{ fontFamily: "monospace", fontSize: 18 }}>
              {doc.path}
            </Typography>
          </Stack>
        )}
        <Table size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
          <TableBody>
            <TableRow>
              <TableCell>Авторизация</TableCell>
              <TableCell>
                <Typography sx={{ fontFamily: "monospace" }}>
                  {apiKeyHeader}: {demoApiKey}
                </Typography>
                <Typography sx={{ fontFamily: "monospace" }}>
                  Authorization: Bearer USER_JWT
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Body</TableCell>
              <TableCell>Для GET путей body не используется</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Права</TableCell>
              <TableCell>viewer, только чтение</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {doc.pathParams && (
          <>
            <Typography variant="h6" fontWeight={500}>
              Path параметры
            </Typography>
            <ParamsTable rows={doc.pathParams} />
          </>
        )}
        {doc.query && (
          <>
            <Typography variant="h6" fontWeight={500}>
              Query параметры
            </Typography>
            <ParamsTable rows={doc.query} />
          </>
        )}
      </Stack>

      <Stack spacing={3}>
        <SectionTitle id="response">Ответ</SectionTitle>
        {doc.responseRows && <ParamsTable rows={doc.responseRows} />}
        {doc.responseExample && <CodeBlock value={doc.responseExample} />}
        {doc.errorExample && (
          <>
            <Typography variant="h6" fontWeight={500}>
              Ошибка
            </Typography>
            <CodeBlock value={doc.errorExample} />
          </>
        )}
      </Stack>

      <Stack spacing={3}>
        <SectionTitle id="examples">Пример запроса</SectionTitle>
        {doc.requestExample && <CodeBlock value={doc.requestExample} />}
        {doc.codeExample && (
          <>
            <Typography variant="h6" fontWeight={500}>
              Готовый код
            </Typography>
            <CodeBlock value={doc.codeExample} />
          </>
        )}
      </Stack>

      {doc.anchors.includes("proto") && (
        <Stack spacing={3}>
          <SectionTitle id="proto">Proto модели</SectionTitle>
          <Typography color="text.secondary">
            Для paginated-date используйте data.PaginatedResponse, для by-date
            используйте data.GetResponse. Переменные расшифровываются отдельным
            запросом /data/category/{"{categoryId}"}/variables.
          </Typography>
          <Box>
            <Button
              component="a"
              href="/docs/data.proto"
              download="data.proto"
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Скачать data.proto
            </Button>
          </Box>
          <CodeBlock value={protoModel} />
        </Stack>
      )}
    </Stack>
  );
}
