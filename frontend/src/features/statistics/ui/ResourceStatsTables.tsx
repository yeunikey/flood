import {
  formatStatisticDate,
  formatStatisticNumber,
} from "@/features/statistics/model/format";
import {
  HecRasListItem,
  SpatialListItem,
} from "@/features/statistics/model/types";
import LayersIcon from "@mui/icons-material/Layers";
import TerrainIcon from "@mui/icons-material/Terrain";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface ResourceStatsTablesProps {
  spatials: SpatialListItem[];
  hecRasProjects: HecRasListItem[];
  loading: boolean;
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography color="text.secondary" align="center">
          Нет данных для отображения
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export default function ResourceStatsTables({
  spatials,
  hecRasProjects,
  loading,
}: ResourceStatsTablesProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <LayersIcon color="primary" sx={{ mt: 0.25 }} />
          <Box>
            <Typography fontWeight={600}>Пространственные данные</Typography>
            <Typography color="text.secondary" fontSize={14}>
              Список всех пространственных слоев
            </Typography>
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell align="right">Тайлы</TableCell>
                  <TableCell>Стиль</TableCell>
                  <TableCell>Легенда</TableCell>
                  <TableCell>Бассейн</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {spatials.map((spatial) => (
                  <TableRow key={spatial.id} hover>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography fontWeight={500}>{spatial.name}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatStatisticNumber(spatial.tilesCount)}
                    </TableCell>
                    <TableCell>
                      {spatial.styleType === "gradient"
                        ? "Градиент"
                        : "Сплошной"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={spatial.legendEnabled ? "Есть" : "Нет"}
                        color={spatial.legendEnabled ? "primary" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{spatial.poolName ?? "-"}</TableCell>
                  </TableRow>
                ))}

                {!spatials.length && <EmptyRow colSpan={5} />}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <TerrainIcon color="primary" sx={{ mt: 0.25 }} />
          <Box>
            <Typography fontWeight={600}>HEC-RAS</Typography>
            <Typography color="text.secondary" fontSize={14}>
              Список загруженных HEC-RAS проектов
            </Typography>
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Файл</TableCell>
                  <TableCell>Дата загрузки</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hecRasProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography fontWeight={500}>{project.name}</Typography>
                    </TableCell>
                    <TableCell>{project.originalFilename}</TableCell>
                    <TableCell>{formatStatisticDate(project.createdAt)}</TableCell>
                  </TableRow>
                ))}

                {!hecRasProjects.length && <EmptyRow colSpan={3} />}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
