"use client";

import {
  fetchHydroParserSites,
  importAllHydroParserSites,
  importHydroParserSite,
} from "@/entities/parser/api/hydroParser";
import { HydroParserSite } from "@/entities/parser/types/hydroParser";
import { useAuth } from "@/shared/model/auth";
import View from "@/shared/ui/View";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function ParserPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<HydroParserSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);

  const loadSites = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setSites(await fetchHydroParserSites(token));
    } catch {
      setError("Не удалось загрузить состояние парсера");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      router.push("/");
    }
  }, [router, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadSites();
  }, [loadSites, user]);

  const filteredSites = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sites;
    return sites.filter(
      (item) =>
        item.site.code.toLowerCase().includes(value) ||
        item.site.name.toLowerCase().includes(value) ||
        item.remote?.name.toLowerCase().includes(value),
    );
  }, [query, sites]);

  const availableCount = sites.filter((item) => item.remoteAvailable).length;

  if (user?.role !== "admin") {
    return null;
  }

  const handleImport = async (item: HydroParserSite) => {
    if (!token || !item.remoteAvailable || importingAll) return;
    setImporting(item.site.code);
    try {
      const result = await importHydroParserSite(token, item.site.code, {});
      toast.success(
        `Загружено: ${result.insertedGroups} наблюдений, ${result.insertedValues} значений`,
      );
      await loadSites();
    } catch {
      toast.error("Не удалось подгрузить данные с ecodata");
    } finally {
      setImporting(null);
    }
  };

  const handleImportAll = async () => {
    if (!token || importing || importingAll) return;
    setImportingAll(true);
    try {
      const result = await importAllHydroParserSites(token);
      if (result.running) {
        toast.info(result.message ?? "Массовый импорт уже выполняется");
        return;
      }

      toast.success(
        `Импортировано: ${result.insertedGroups ?? 0} наблюдений, ${
          result.insertedValues ?? 0
        } значений. Успешно: ${result.successfulSites ?? 0}, ошибок: ${
          result.failedSites ?? 0
        }`,
      );
      await loadSites();
    } catch {
      toast.error("Не удалось запустить импорт всех точек");
    } finally {
      setImportingAll(false);
    }
  };

  return (
    <View
      links={["Паводки", "Парсер гидропостов"]}
      className="flex flex-col overflow-y-auto bg-slate-50"
    >
      <Box
        sx={{
          width: "100%",
          p: { xs: 2, sm: 3, lg: 5 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Парсер гидропостов
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              Доступно на ecodata: {availableCount} из {sites.length}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Button
              variant="contained"
              startIcon={
                importingAll ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CloudDownloadIcon />
                )
              }
              onClick={handleImportAll}
              disabled={loading || Boolean(importing) || importingAll}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Импортировать все
            </Button>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={loadSites}
              disabled={loading || importingAll}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Обновить
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по коду или названию"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Site</TableCell>
                <TableCell>Наличие</TableCell>
                <TableCell>В базе</TableCell>
                <TableCell>Сейчас на сайте</TableCell>
                <TableCell align="right">Действие</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !sites.length ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                filteredSites.map((item) => (
                  <TableRow key={item.site.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{item.site.code}</Typography>
                      <Typography color="text.secondary" fontSize={13}>
                        {item.site.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.remoteAvailable ? "success" : "default"}
                        label={item.remoteAvailable ? "Есть" : "Нет"}
                      />
                    </TableCell>
                    <TableCell>
                      {item.loaded ? (
                        <>
                          <Typography fontSize={13} fontWeight={600}>
                            Последняя: {item.loaded.endDate}
                          </Typography>
                          <Typography fontSize={13}>
                            Период: {item.loaded.startDate} - {item.loaded.endDate}
                          </Typography>
                          <Typography color="text.secondary" fontSize={12}>
                            {item.loaded.groupsCount} наблюдений
                          </Typography>
                        </>
                      ) : (
                        <Typography color="text.secondary" fontSize={13}>
                          Нет данных
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.remote ? (
                        <>
                          <Typography fontSize={13}>
                            {item.remote.remoteDate ?? "Дата не указана"}
                          </Typography>
                          <Typography color="text.secondary" fontSize={12}>
                            Уровень:{" "}
                            {item.remote.currentValues["Фактический уровень, см"] ??
                              "нет"}{" "}
                            · Расход:{" "}
                            {item.remote.currentValues[
                              "Фактический расход, м³/с"
                            ] ?? "нет"}
                          </Typography>
                        </>
                      ) : (
                        <Typography color="text.secondary" fontSize={13}>
                          Не найдено
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          importing === item.site.code ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <CloudDownloadIcon />
                          )
                        }
                        disabled={
                          !item.remoteAvailable || Boolean(importing) || importingAll
                        }
                        onClick={() => handleImport(item)}
                      >
                        Подгрузить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </View>
  );
}
