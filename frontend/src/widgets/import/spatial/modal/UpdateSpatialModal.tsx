import { useEffect, useRef, useState } from "react";
import {
  Divider,
  Modal,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  IconButton,
  List,
  FormControl,
  InputLabel,
  ListItem,
  MenuItem,
  Radio,
  Select,
  Slider,
  Switch,
  FormHelperText,
} from "@mui/material";
import ModalBox from "@/shared/ui/el/ModalBox";
import MapboxMap from "@/shared/ui/MapboxMap";
import {
  Map,
  SourceSpecification,
  DataDrivenPropertyValueSpecification,
  ColorSpecification,
  MapSourceDataEvent,
} from "mapbox-gl";
import { FeatureCollection } from "geojson";
import { api, vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";
import Loading from "@/shared/ui/el/Loading";
import {
  Spatial,
  SpatialLegendItem,
  SpatialStyle,
} from "@/entities/spatial/types/spatial";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useSpatial } from "@/entities/spatial/model/useSpatial";

interface Tile {
  id: string;
  name: string;
}

interface SpatialResponse {
  spatial: Spatial;
  tiles: Tile[];
}

interface UpdateSpatialModalProps {
  open: boolean;
  spatialData: SpatialResponse;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UpdateSpatialModal({
  open,
  spatialData,
  onClose,
  onSuccess,
}: UpdateSpatialModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const { spatials, setSpatials } = useSpatial();

  const [tabIndex, setTabIndex] = useState(0);
  // Используем useState вместо useRef для карты, чтобы вызвать ре-рендер при инициализации
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(spatialData.spatial.name);

  const [keptTiles, setKeptTiles] = useState<Tile[]>(spatialData.tiles || []);

  const [files, setFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const [previewType, setPreviewType] = useState<"existing" | "new" | null>(
    spatialData.tiles && spatialData.tiles.length > 0 ? "existing" : null,
  );
  const [previewId, setPreviewId] = useState<string | null>(
    spatialData.tiles && spatialData.tiles.length > 0
      ? spatialData.tiles[0].id
      : null,
  );
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const [previewGeoJson, setPreviewGeoJson] =
    useState<FeatureCollection | null>(null);
  const [availableProperties, setAvailableProperties] = useState<string[]>([]);

  const [styleType, setStyleType] = useState<"solid" | "gradient">(
    spatialData.spatial.style.type,
  );
  const [borderColor, setBorderColor] = useState(
    spatialData.spatial.style.borderColor || "#333333",
  );
  // Используем ?? чтобы не сбрасывать 0 если он был установлен, и берем значение из пропсов корректно
  const [borderWidth, setBorderWidth] = useState(
    spatialData.spatial.style.borderWidth ?? 1,
  );
  const [opacity, setOpacity] = useState(
    spatialData.spatial.style.opacity ?? 0.6,
  );
  const [fillColor, setFillColor] = useState(
    spatialData.spatial.style.fillColor || "#1976d2",
  );

  const [gradientVar, setGradientVar] = useState(
    spatialData.spatial.style.gradient?.variable || "",
  );
  const [minColor, setMinColor] = useState(
    spatialData.spatial.style.gradient?.minColor || "#ffffff",
  );
  const [maxColor, setMaxColor] = useState(
    spatialData.spatial.style.gradient?.maxColor || "#ff0000",
  );

  const [legendEnabled, setLegendEnabled] = useState(
    spatialData.spatial.legend?.enabled || false,
  );
  const [legendTitle, setLegendTitle] = useState(
    spatialData.spatial.legend?.title || "",
  );
  const [legendItems, setLegendItems] = useState<SpatialLegendItem[]>(
    spatialData.spatial.legend?.items || [],
  );

  const [newItemValue, setNewItemValue] = useState("");
  const [newItemColor, setNewItemColor] = useState("#000000");
  const [newItemLabel, setNewItemLabel] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newNames = newFiles.map((f) => f.name.replace(/\.[^/.]+$/, ""));

      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        if (!previewType && updated.length > 0) {
          setPreviewType("new");
          setPreviewIndex(prev.length);
        }
        return updated;
      });
      setFileNames((prev) => [...prev, ...newNames]);
    }
    e.target.value = "";
  };

  const removeNewFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileNames((prev) => prev.filter((_, i) => i !== index));

    if (previewType === "new" && previewIndex === index) {
      setPreviewType(null);
      setPreviewIndex(null);
      setPreviewGeoJson(null);
    } else if (
      previewType === "new" &&
      previewIndex !== null &&
      previewIndex > index
    ) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const removeKeptTile = (id: string) => {
    setKeptTiles((prev) => prev.filter((t) => t.id !== id));
    if (previewType === "existing" && previewId === id) {
      setPreviewType(null);
      setPreviewId(null);
    }
  };

  const updateFileName = (index: number, newName: string) => {
    setFileNames((prev) => {
      const copy = [...prev];
      copy[index] = newName;
      return copy;
    });
  };

  useEffect(() => {
    if (
      previewType !== "new" ||
      previewIndex === null ||
      !files[previewIndex]
    ) {
      setPreviewGeoJson(null);
      return;
    }

    const file = files[previewIndex];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        setPreviewGeoJson(parsed);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to parse GeoJSON: ${file.name}`);
      }
    };
    reader.readAsText(file);
  }, [previewType, previewIndex, files]);

  const SOURCE_ID = "preview-source";
  const LAYER_FILL_ID = "preview-layer-fill";
  const LAYER_LINE_ID = "preview-layer-line";

  useEffect(() => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    if (mapInstance.getLayer(LAYER_FILL_ID))
      mapInstance.removeLayer(LAYER_FILL_ID);
    if (mapInstance.getLayer(LAYER_LINE_ID))
      mapInstance.removeLayer(LAYER_LINE_ID);
    if (mapInstance.getSource(SOURCE_ID)) mapInstance.removeSource(SOURCE_ID);

    setAvailableProperties([]);

    let sourceData: SourceSpecification | null = null;

    if (previewType === "new" && previewGeoJson) {
      sourceData = { type: "geojson", data: previewGeoJson };
    } else if (previewType === "existing" && previewId) {
      sourceData = {
        type: "vector",
        tiles: [
          `http://localhost:3001/v1/tiles/server/${previewId}/{z}/{x}/{y}.pbf`,
        ],
        minzoom: 0,
        maxzoom: 14,
      };
    }

    if (sourceData) {
      mapInstance.addSource(SOURCE_ID, sourceData);

      const sourceLayer =
        previewType === "existing" && previewId
          ? previewId.replace(/-/g, "")
          : undefined;

      let finalFillColor: DataDrivenPropertyValueSpecification<ColorSpecification> =
        fillColor;

      if (styleType === "gradient" && gradientVar) {
        finalFillColor = [
          "interpolate",
          ["linear"],
          ["get", gradientVar],
          0,
          minColor,
          100,
          maxColor,
        ];
      }

      mapInstance.addLayer({
        id: LAYER_FILL_ID,
        type: "fill",
        source: SOURCE_ID,
        "source-layer": sourceLayer,
        paint: {
          "fill-color": finalFillColor,
          "fill-opacity": opacity,
        },
      });

      mapInstance.addLayer({
        id: LAYER_LINE_ID,
        type: "line",
        source: SOURCE_ID,
        "source-layer": sourceLayer,
        paint: { "line-color": borderColor, "line-width": borderWidth },
      });

      const updateMapData = () => {
        if (!mapInstance) return;
        const features = mapInstance.querySourceFeatures(SOURCE_ID, {
          sourceLayer: sourceLayer,
        });

        if (!features || features.length === 0) return;

        const propsSet = new Set<string>();
        let min = Infinity;
        let max = -Infinity;
        let hasData = false;

        for (const feature of features) {
          if (feature.properties) {
            for (const key in feature.properties) {
              const val = feature.properties[key];
              if (typeof val === "number") {
                propsSet.add(key);
                if (key === gradientVar) {
                  if (val < min) min = val;
                  if (val > max) max = val;
                  hasData = true;
                }
              }
            }
          }
        }

        const newProps = Array.from(propsSet).sort();
        setAvailableProperties((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(newProps))
            return newProps;
          return prev;
        });

        if (
          styleType === "gradient" &&
          gradientVar &&
          hasData &&
          min !== Infinity &&
          max !== -Infinity &&
          min !== max
        ) {
          mapInstance.setPaintProperty(LAYER_FILL_ID, "fill-color", [
            "interpolate",
            ["linear"],
            ["get", gradientVar],
            min,
            minColor,
            max,
            maxColor,
          ]);
        }
      };

      const onSourceData = (e: MapSourceDataEvent) => {
        if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(updateMapData, 100);
        }
      };

      mapInstance.on("sourcedata", onSourceData);
      updateMapData();

      return () => {
        mapInstance.off("sourcedata", onSourceData);
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }
  }, [
    previewType,
    previewId,
    previewGeoJson,
    styleType,
    fillColor,
    opacity,
    borderColor,
    borderWidth,
    minColor,
    maxColor,
    gradientVar,
    mapInstance,
  ]);

  const addLegendItem = () => {
    if (!newItemValue || !newItemLabel) return;
    setLegendItems([
      ...legendItems,
      { value: newItemValue, color: newItemColor, label: newItemLabel },
    ]);
    setNewItemValue("");
    setNewItemLabel("");
  };

  const removeLegendItem = (idx: number) => {
    setLegendItems(legendItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name) return toast.error("Введите название");
    if (keptTiles.length === 0 && files.length === 0)
      return toast.error(
        "Должен быть хотя бы один тайл (существующий или новый)",
      );

    setLoading(true);
    const newTileIds: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tileName = fileNames[i] || file.name.replace(/\.[^/.]+$/, "");
        setUploadProgress(`Загрузка ${i + 1} из ${files.length}: ${tileName}`);

        const formData = new FormData();
        formData.append("geo", file);
        formData.append("name", tileName);

        const res = await vapi.post("/tiles/upload", formData, {
          headers: { Authorization: "Bearer " + token },
        });

        if (res.data?.uuid) {
          newTileIds.push(res.data.uuid);
        }
      }

      setUploadProgress("Обновление...");

      const finalTileIds = [...keptTiles.map((t) => t.id), ...newTileIds];

      const stylePayload: SpatialStyle = {
        type: styleType,
        borderColor,
        borderWidth,
        opacity,
        ...(styleType === "solid"
          ? { fillColor }
          : {
              gradient: { variable: gradientVar, minColor, maxColor },
            }),
      };

      const legendPayload = legendEnabled
        ? { enabled: true, title: legendTitle, items: legendItems }
        : null;

      const payload = {
        name,
        tileIds: finalTileIds,
        style: stylePayload,
        legend: legendPayload,
        poolId: spatialData.spatial.pool?.id,
      };

      const res = await api.post(`data/spatial/${spatialData.spatial.id}`, payload, {
        headers: { Authorization: "Bearer " + token },
      });

      const updatedItem = res.data.data;

      const updatedList = spatials.map((item: SpatialResponse) =>
        item.spatial.id === updatedItem.spatial.id ? updatedItem : item,
      );

      setSpatials(updatedList);

      toast.success("Обновлено!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Ошибка при обновлении");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Modal open={open}>
      <ModalBox className="relative w-5xl! overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/25 flex flex-col justify-center items-center z-50">
            <Loading />
            <Typography className="pt-6 font-medium text-gray-700">
              {uploadProgress}
            </Typography>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Typography variant="h6">
            Редактирование: {spatialData.spatial.name}
          </Typography>
          <Divider />
        </div>

        <div className="grid grid-cols-2 gap-6 h-124 mt-4">
          <div className="flex flex-col gap-3 h-full">
            <Typography fontWeight={500}>Название</Typography>
            <TextField
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <Typography fontWeight={500}>Превью</Typography>
              <div className="relative flex-1 rounded-xl overflow-hidden border border-gray-200">
                <MapboxMap
                  className="w-full h-full absolute inset-0"
                  setMap={setMapInstance} // Передаем сеттер стейта
                  mapStyle="mapbox://styles/mapbox/light-v10"
                />
              </div>
              <Typography variant="caption" color="text.secondary">
                {previewType === "existing" &&
                  "Превью: Существующий тайл (Vector)"}
                {previewType === "new" &&
                  `Превью: ${files[previewIndex!]?.name} (Local GeoJSON)`}
                {!previewType && "Выберите тайл для превью"}
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-3 overflow-hidden h-full">
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabIndex} onChange={handleTabChange}>
                <Tab label="Тайлы" />
                <Tab label="Стиль" />
                <Tab label="Легенда" />
              </Tabs>
            </Box>

            <div className="flex-1 overflow-y-auto p-1">
              {tabIndex === 0 && (
                <div className="flex flex-col gap-3 h-full">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    className="h-12 border-dashed border-2"
                  >
                    Добавить файлы
                    <input
                      hidden
                      type="file"
                      accept=".geojson,.json"
                      onChange={handleFileSelect}
                      multiple
                    />
                  </Button>

                  <List dense className="flex-1 overflow-y-auto">
                    {keptTiles.length > 0 && (
                      <>
                        <Typography
                          variant="caption"
                          className="px-2 font-bold text-gray-500"
                        >
                          Существующие тайлы
                        </Typography>
                        {keptTiles.map((tile) => (
                          <ListItem
                            key={tile.id}
                            divider
                            disablePadding
                            className="p-2"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Radio
                                checked={
                                  previewType === "existing" &&
                                  previewId === tile.id
                                }
                                size="small"
                                onChange={() => {
                                  setPreviewType("existing");
                                  setPreviewId(tile.id);
                                }}
                                sx={{ p: 0.5 }}
                              />
                              <div className="flex-1">
                                <Typography variant="body2">
                                  {tile.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  className="font-mono text-[10px]"
                                >
                                  {tile.id.split("-")[0]}...
                                </Typography>
                              </div>
                              <IconButton
                                size="small"
                                onClick={() => removeKeptTile(tile.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </div>
                          </ListItem>
                        ))}
                      </>
                    )}

                    {files.length > 0 && (
                      <>
                        <Typography
                          variant="caption"
                          className="px-2 font-bold text-gray-500 mt-2 block"
                        >
                          Новые файлы
                        </Typography>
                        {files.map((file, index) => (
                          <ListItem
                            key={index}
                            divider
                            disablePadding
                            className="p-2"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Radio
                                checked={
                                  previewType === "new" &&
                                  previewIndex === index
                                }
                                size="small"
                                onChange={() => {
                                  setPreviewType("new");
                                  setPreviewIndex(index);
                                }}
                                sx={{ p: 0.5 }}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <TextField
                                  size="small"
                                  variant="standard"
                                  value={fileNames[index]}
                                  onChange={(e) =>
                                    updateFileName(index, e.target.value)
                                  }
                                  fullWidth
                                  placeholder="Название"
                                />
                                <Typography
                                  variant="caption"
                                  className="text-gray-400 text-[10px] truncate"
                                >
                                  {file.name}
                                </Typography>
                              </div>
                              <Typography
                                variant="caption"
                                className="whitespace-nowrap text-gray-400"
                              >
                                {(file.size / 1024).toFixed(0) + " KB"}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => removeNewFile(index)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </div>
                          </ListItem>
                        ))}
                      </>
                    )}

                    {keptTiles.length === 0 && files.length === 0 && (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        Нет тайлов
                      </div>
                    )}
                  </List>
                </div>
              )}

              {tabIndex === 1 && (
                <div className="flex flex-col gap-3">
                  <FormControl fullWidth size="small">
                    <InputLabel>Тип заливки</InputLabel>
                    <Select
                      value={styleType}
                      label="Тип заливки"
                      onChange={(e) =>
                        setStyleType(e.target.value as "solid" | "gradient")
                      }
                    >
                      <MenuItem value="solid">Солид</MenuItem>
                      <MenuItem value="gradient">Градиент</MenuItem>
                    </Select>
                  </FormControl>

                  <Box className="p-3 border border-neutral-200 rounded flex flex-col gap-3">
                    <Typography
                      variant="caption"
                      className="uppercase text-gray-500 font-bold"
                    >
                      Граница
                    </Typography>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-10 h-10 cursor-pointer border-0 rounded overflow-hidden"
                      />
                      <div className="flex-1">
                        <Typography variant="caption">
                          Ширина: {borderWidth}px
                        </Typography>
                        <Slider
                          value={borderWidth}
                          min={0}
                          max={5}
                          step={0.1}
                          onChange={(_, v) => setBorderWidth(v as number)}
                          size="small"
                        />
                      </div>
                    </div>
                  </Box>

                  <Box className="p-3 border border-neutral-200 rounded flex flex-col gap-3">
                    <Typography
                      variant="caption"
                      className="uppercase text-gray-500 font-bold"
                    >
                      Заполнение
                    </Typography>
                    <div>
                      <Typography variant="caption">
                        Прозрачность: {opacity}
                      </Typography>
                      <Slider
                        value={opacity}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(_, v) => setOpacity(v as number)}
                        size="small"
                      />
                    </div>

                    {styleType === "solid" ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="w-10 h-10 cursor-pointer border rounded"
                        />
                        <Typography variant="body2">Цвет</Typography>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <FormControl fullWidth size="small">
                          <InputLabel>Переменная</InputLabel>
                          <Select
                            value={gradientVar}
                            label="Переменная"
                            onChange={(e) => setGradientVar(e.target.value)}
                          >
                            {availableProperties.map((prop) => (
                              <MenuItem key={prop} value={prop}>
                                {prop}
                              </MenuItem>
                            ))}
                            {!availableProperties.includes(gradientVar) &&
                              gradientVar && (
                                <MenuItem value={gradientVar}>
                                  {gradientVar}
                                </MenuItem>
                              )}
                          </Select>
                          <FormHelperText>
                            Выберите свойство из GeoJSON для градиента
                          </FormHelperText>
                        </FormControl>

                        <div className="flex gap-2">
                          <div className="flex-1 flex flex-col gap-1">
                            <Typography variant="caption">Мин.</Typography>
                            <input
                              type="color"
                              value={minColor}
                              onChange={(e) => setMinColor(e.target.value)}
                              className="w-full h-8 cursor-pointer border rounded"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <Typography variant="caption">Макс.</Typography>
                            <input
                              type="color"
                              value={maxColor}
                              onChange={(e) => setMaxColor(e.target.value)}
                              className="w-full h-8 cursor-pointer border rounded"
                            />
                          </div>
                        </div>
                        <div
                          className="h-4 w-full rounded border"
                          style={{
                            background: `linear-gradient(to right, ${minColor}, ${maxColor})`,
                          }}
                        />
                      </div>
                    )}
                  </Box>
                </div>
              )}

              {tabIndex === 2 && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex justify-between items-center">
                    <Typography variant="body2" className="font-medium">
                      Показать легенду
                    </Typography>
                    <Switch
                      checked={legendEnabled}
                      onChange={(e) => setLegendEnabled(e.target.checked)}
                      size="small"
                    />
                  </div>

                  {legendEnabled && (
                    <div className="flex flex-col gap-2 flex-1 min-h-0">
                      <TextField
                        label="Заголовок"
                        size="small"
                        value={legendTitle}
                        onChange={(e) => setLegendTitle(e.target.value)}
                        fullWidth
                      />

                      <div className="flex gap-2 items-start">
                        <TextField
                          label="Значение"
                          size="small"
                          className="w-24"
                          value={newItemValue}
                          onChange={(e) => setNewItemValue(e.target.value)}
                        />
                        <TextField
                          label="Название"
                          size="small"
                          fullWidth
                          value={newItemLabel}
                          onChange={(e) => setNewItemLabel(e.target.value)}
                        />
                        <IconButton
                          color="primary"
                          onClick={addLegendItem}
                          className="bg-blue-50"
                        >
                          <AddIcon />
                        </IconButton>
                      </div>

                      <Divider />

                      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                        {legendItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-white p-2 rounded border border-neutral-200"
                          >
                            <Typography
                              variant="caption"
                              className="font-mono bg-gray-100 px-1 rounded"
                            >
                              {item.value}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="flex-1 truncate"
                            >
                              {item.label}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => removeLegendItem(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>
            Отменить
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            Сохранить
          </Button>
        </div>
      </ModalBox>
    </Modal>
  );
}
