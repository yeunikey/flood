/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RawSite, useImportStore } from "../../model/useImportStore";
import { useAuth } from "@/shared/model/auth";
import { api } from "@/shared/model/api/instance";
import { ApiResponse } from "@/types";
import { useSitesTypes } from "@/entities/site/model/useSitesTypes";
import SiteType from "@/entities/site/types/site_type";

function SelectSite() {
  const { setFile, setSelectedType, sites, setSites } = useImportStore();
  const { token } = useAuth();
  const { siteTypes, fetchSiteTypes, setSiteTypes } = useSitesTypes();

  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  // site type выбор/создание
  const [siteTypeMode, setSiteTypeMode] = useState<"existing" | "create">(
    "existing",
  );
  const [selectedSiteTypeId, setSelectedSiteTypeId] = useState("");
  const [newSiteType, setNewSiteType] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (token) {
      fetchSiteTypes(token);
    }
  }, [token]);

  const handleToggle = (index: number) => {
    setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);

      Papa.parse(selectedFile, {
        complete: (result) => {
          const data = result.data as string[][];

          const cleanedData = data.filter((row) =>
            row.some((cell) => cell.trim() !== ""),
          );

          if (cleanedData.length > 1) {
            const headers = cleanedData[0].map((h) => h.toLowerCase());

            const required = ["code", "latitude", "longitude", "name"];
            for (const r of required) {
              if (!headers.includes(r)) {
                toast.error(
                  `.csv файл должен содержать поле ${required.join(", ")}`,
                );
                return;
              }
            }

            const parsedSites: RawSite[] = cleanedData.slice(1).map((row) => {
              const obj: any = {};
              cleanedData[0].forEach((col, idx) => {
                obj[col] = row[idx];
              });
              return obj as RawSite;
            });

            setSites(parsedSites);

            toast.success(".csv файл успешно загружен");
          }
        },
        skipEmptyLines: true,
        encoding: "UTF-8",
      });
    } else {
      toast.error("Выберите .csv файл");
    }
  };

  const handleCreateSiteType = async () => {
    if (!newSiteType.name || !newSiteType.description) {
      toast.error("Заполните все поля типа точки");
      return;
    }
    try {
      const res = await api.post<ApiResponse<SiteType>>(
        "/sites/types",
        newSiteType,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.statusCode != 200) {
        toast.error("Ошибка при создании типа точки");
        return;
      }

      const createdType = res.data.data;
      setSiteTypes([...siteTypes, createdType]);
      setSelectedSiteTypeId(String(createdType.id));
      setSiteTypeMode("existing");
      setSelectedType(createdType);

      toast.success("Тип точки успешно создан");
    } catch {
      toast.error("Произошла ошибка при создании типа точки");
    }
  };

  return (
    <Zoom in={true} timeout={500}>
      <div className="mt-10 space-y-3 rounded-lg border border-gray-200 w-full max-w-2xl p-5">
        {sites.length == 0 && (
          <>
            <Typography variant="h6">Загрузка точек</Typography>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3"
            />
          </>
        )}

        {sites.length > 0 && (
          <>
            <Typography variant="h6">Тип точки</Typography>

            <div className="flex flex-col gap-2 mt-4">
              <FormControl fullWidth size="small" className="mt-2">
                <InputLabel>Режим</InputLabel>
                <Select
                  value={siteTypeMode}
                  onChange={(e) =>
                    setSiteTypeMode(e.target.value as "existing" | "create")
                  }
                  label="Режим"
                >
                  <MenuItem value="existing">Выбрать существующий</MenuItem>
                  <MenuItem value="create">Создать новый</MenuItem>
                </Select>
              </FormControl>

              {siteTypeMode === "existing" ? (
                <FormControl fullWidth size="small" className="mt-3">
                  <InputLabel>Тип точки</InputLabel>
                  <Select
                    value={selectedSiteTypeId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSiteTypeId(id);

                      const found = siteTypes.find((t) => String(t.id) === id);
                      if (found) {
                        setSelectedType(found);
                      }
                    }}
                    label="Тип точки"
                  >
                    {siteTypes.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    label="Название типа"
                    value={newSiteType.name}
                    onChange={(e) =>
                      setNewSiteType({ ...newSiteType, name: e.target.value })
                    }
                    className="mt-3"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Описание"
                    value={newSiteType.description}
                    onChange={(e) =>
                      setNewSiteType({
                        ...newSiteType,
                        description: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                  <div className="flex justify-end mt-3">
                    <Button variant="contained" onClick={handleCreateSiteType}>
                      Сохранить тип
                    </Button>
                  </div>
                </>
              )}
            </div>

            <Divider className="!my-4" />

            <Typography variant="h6">Список точек ({sites.length})</Typography>

            <List>
              {sites.map((site, idx) => (
                <div key={idx}>
                  <ListItemButton onClick={() => handleToggle(idx)}>
                    <ListItemText
                      primary={`${site.name || "Без названия"} (${site.code})`}
                    />
                    {openItems[idx] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={openItems[idx]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      <ListItem>
                        <ListItemText primary={`Код: ${site.code}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary={`Широта: ${site.latitude}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary={`Долгота: ${site.longitude}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary={`Название: ${site.name}`} />
                      </ListItem>
                    </List>
                  </Collapse>
                </div>
              ))}
            </List>
          </>
        )}
      </div>
    </Zoom>
  );
}

export default SelectSite;
