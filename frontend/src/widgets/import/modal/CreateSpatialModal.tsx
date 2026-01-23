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
  ListItemText,
  MenuItem,
  Radio,
  Select,
  Slider,
  Switch,
  ListItemButton,
} from "@mui/material";
import ModalBox from "@/shared/ui/el/ModalBox";
import MapboxMap from "@/shared/ui/MapboxMap";
import { GeoJSONSource, Map } from "mapbox-gl";
import { FeatureCollection } from "geojson";
import { api, vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";
import Loading from "@/shared/ui/el/Loading";
import {
  SpatialLegend,
  SpatialLegendItem,
  SpatialStyle,
} from "@/entities/spatial/types/spatial";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface CreateSpatialModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateSpatialModal({
  open,
  onClose,
  onSuccess,
}: CreateSpatialModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [tabIndex, setTabIndex] = useState(0);
  const mapRef = useRef<Map | null>(null);

  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewFileIndex, setPreviewFileIndex] = useState<number | null>(null);
  const [previewGeoJson, setPreviewGeoJson] =
    useState<FeatureCollection | null>(null);

  const [styleType, setStyleType] = useState<"solid" | "gradient">("solid");
  const [borderColor, setBorderColor] = useState("#333333");
  const [borderWidth, setBorderWidth] = useState(1);
  const [opacity, setOpacity] = useState(0.6);

  const [fillColor, setFillColor] = useState("#1976d2");

  const [gradientVar, setGradientVar] = useState("");
  const [minColor, setMinColor] = useState("#ffffff");
  const [maxColor, setMaxColor] = useState("#ff0000");

  const [legendEnabled, setLegendEnabled] = useState(false);
  const [legendItems, setLegendItems] = useState<SpatialLegendItem[]>([]);
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemColor, setNewItemColor] = useState("#000000");
  const [newItemLabel, setNewItemLabel] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        if (prev.length === 0 && newFiles.length > 0) {
          setPreviewFileIndex(0);
        }
        return updated;
      });
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (previewFileIndex === index) {
      setPreviewFileIndex(null);
      setPreviewGeoJson(null);
    } else if (previewFileIndex !== null && previewFileIndex > index) {
      setPreviewFileIndex(previewFileIndex - 1);
    }
  };

  useEffect(() => {
    if (previewFileIndex === null || !files[previewFileIndex]) {
      setPreviewGeoJson(null);
      return;
    }

    const file = files[previewFileIndex];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        setPreviewGeoJson(parsed);

        if (parsed.features?.[0]?.properties && !gradientVar) {
          const numProp = Object.keys(parsed.features[0].properties).find(
            (k) => typeof parsed.features[0].properties[k] === "number",
          );
          if (numProp) setGradientVar(numProp);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Failed to parse GeoJSON: ${file.name}`);
      }
    };
    reader.readAsText(file);
  }, [previewFileIndex, files]);

  const SOURCE_ID = "preview-source";
  const LAYER_FILL_ID = "preview-layer-fill";
  const LAYER_LINE_ID = "preview-layer-line";

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (previewGeoJson) {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource;
      if (source) {
        source.setData(previewGeoJson);
      } else {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: previewGeoJson,
        });

        if (!map.getLayer(LAYER_FILL_ID)) {
          map.addLayer({
            id: LAYER_FILL_ID,
            type: "fill",
            source: SOURCE_ID,
            paint: { "fill-color": fillColor, "fill-opacity": opacity },
          });
        }
        if (!map.getLayer(LAYER_LINE_ID)) {
          map.addLayer({
            id: LAYER_LINE_ID,
            type: "line",
            source: SOURCE_ID,
            paint: { "line-color": borderColor, "line-width": borderWidth },
          });
        }
      }

      try {
      } catch (e) {
        console.warn("Could not fit bounds", e);
      }
    } else {
      if (map.getSource(SOURCE_ID)) {
        const src = map.getSource(SOURCE_ID) as GeoJSONSource;
        src.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }, [previewGeoJson, mapRef.current]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(LAYER_FILL_ID)) return;

    map.setPaintProperty(LAYER_LINE_ID, "line-color", borderColor);
    map.setPaintProperty(LAYER_LINE_ID, "line-width", borderWidth);

    map.setPaintProperty(LAYER_FILL_ID, "fill-opacity", opacity);

    if (styleType === "solid") {
      map.setPaintProperty(LAYER_FILL_ID, "fill-color", fillColor);
    } else if (styleType === "gradient" && gradientVar && previewGeoJson) {
      let min = Number.MAX_VALUE;
      let max = Number.MIN_VALUE;

      previewGeoJson.features.forEach((f) => {
        const val = f.properties?.[gradientVar];
        if (typeof val === "number") {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });

      if (min !== Number.MAX_VALUE && max !== Number.MIN_VALUE && min !== max) {
        map.setPaintProperty(LAYER_FILL_ID, "fill-color", [
          "interpolate",
          ["linear"],
          ["get", gradientVar],
          min,
          minColor,
          max,
          maxColor,
        ]);
      } else {
        map.setPaintProperty(LAYER_FILL_ID, "fill-color", minColor);
      }
    }
  }, [
    styleType,
    fillColor,
    opacity,
    borderColor,
    borderWidth,
    minColor,
    maxColor,
    gradientVar,
    previewGeoJson, 
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
    if (files.length === 0)
      return toast.error("Загрузите хотя бы один GeoJSON файл");

    setLoading(true);
    const tileIds: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Загрузка ${i + 1} из ${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append("geo", file);
        formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

        const res = await vapi.post("/tiles/upload", formData, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (res.data?.uuid) {
          tileIds.push(res.data.uuid);
        } else {
          throw new Error(`Upload failed for ${file.name}: No UUID returned`);
        }
      }

      setUploadProgress("Создание пространственного объекта...");

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

      const legendPayload: SpatialLegend | null = legendEnabled
        ? { enabled: true, items: legendItems }
        : null;

      const payload = {
        name,
        tileIds,
        style: stylePayload,
        legend: legendPayload,
      };

      await api.post("data/spatial", payload, {
        headers: { Authorization: "Bearer " + token },
      });

      toast.success("Spatial created successfully");
      if (onSuccess) onSuccess();
      onClose();

      setName("");
      setFiles([]);
      setPreviewFileIndex(null);
      setPreviewGeoJson(null);
    } catch {
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
            Создание пространственного объекта
          </Typography>
          <Divider />
        </div>

        <div className="grid grid-cols-2 gap-6 h-124 mt-4">
          <div className="flex flex-col gap-3 h-full">
            <Typography fontWeight={500}>Название</Typography>
            <TextField
              label="Название"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              placeholder="Название"
            />

            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <Typography fontWeight={500}>Превью</Typography>
              <div className="relative flex-1 rounded-xl overflow-hidden border border-gray-200">
                <MapboxMap
                  className="w-full h-full absolute inset-0"
                  setMap={(m) => {
                    mapRef.current = m;
                  }}
                  mapStyle="mapbox://styles/mapbox/light-v10"
                />
              </div>
              <Typography variant="caption" color="text.secondary">
                {previewFileIndex !== null
                  ? `Превью: ${files[previewFileIndex]?.name}`
                  : "Выборите файл для превью"}
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
              {/* TAB 0: FILES */}
              {tabIndex === 0 && (
                <div className="flex flex-col gap-3 h-full">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    className="h-12 border-dashed border-2"
                  >
                    Загрузка GeoJSON
                    <input
                      hidden
                      type="file"
                      accept=".geojson,.json"
                      onChange={handleFileSelect}
                      multiple
                    />
                  </Button>

                  <List dense className="flex-1 overflow-y-auto">
                    {files.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Файлы не выбраны
                      </div>
                    )}
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        divider
                        disablePadding
                        secondaryAction={
                          <IconButton
                            size="small"
                            onClick={() => removeFile(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          selected={previewFileIndex === index}
                          onClick={() => setPreviewFileIndex(index)}
                        >
                          <Radio
                            checked={previewFileIndex === index}
                            size="small"
                            onChange={() => setPreviewFileIndex(index)}
                            sx={{ mr: 1 }}
                          />
                          <ListItemText
                            primary={file.name}
                            secondary={(file.size / 1024).toFixed(0) + " KB"}
                            primaryTypographyProps={{
                              noWrap: true,
                              variant: "body2",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
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
                      onChange={(e) => setStyleType(e.target.value)}
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
                      <div className="flex flex-col items-center">
                        <input
                          type="color"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="w-10 h-10 cursor-pointer border-0 p-0 rounded overflow-hidden"
                        />
                      </div>
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
                        <TextField
                          label="Переменная"
                          size="small"
                          fullWidth
                          value={gradientVar}
                          onChange={(e) => setGradientVar(e.target.value)}
                          helperText="Значение из GeoJSON свойств для градиента"
                        />
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
                          className="bg-blue-50 hover:bg-blue-100"
                        >
                          <AddIcon />
                        </IconButton>
                      </div>

                      <Divider />

                      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                        {legendItems.length === 0 && (
                          <Typography
                            variant="caption"
                            className="text-center text-gray-400 py-4"
                          >
                            Добавить элементы легенды выше
                          </Typography>
                        )}
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
                              color="default"
                              onClick={() => removeLegendItem(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!legendEnabled && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Легенда отключена
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
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!name || files.length === 0 || loading}
          >
            Создать
          </Button>
        </div>
      </ModalBox>
    </Modal>
  );
}
