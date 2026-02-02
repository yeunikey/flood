import { useEffect, useState } from "react";
import {
  Divider,
  Modal,
  Typography,
  TextField,
  Checkbox,
  Button,
  Tab,
  Box,
  Tabs,
} from "@mui/material";
import ModalBox from "@/shared/ui/el/ModalBox";
import { useSites } from "@/entities/site/model/useSites";
import MapboxMap from "@/shared/ui/MapboxMap";
import { Map } from "mapbox-gl";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FeatureCollection, Geometry } from "geojson";
import { usePoolStore } from "../model/usePoolStore";
import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { toast } from "react-toastify";
import Loading from "@/shared/ui/el/Loading";
import { usePools } from "@/entities/pool/model/usePools";
import { useSpatial } from "@/entities/spatial/model/useSpatial";
import { useHecRas } from "@/entities/hec-ras/model/useHecRas";

function UpdatePoolModal() {
  const { token } = useAuth();
  const { sites } = useSites();
  const { spatials } = useSpatial();
  const { hecRas } = useHecRas();
  const { pools, setPools } = usePools();
  const { updatePoolModal, setUpdatePoolModal, editingPool } = usePoolStore();
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const filteredSites =
    sites?.filter((site) =>
      (site.name + " " + site.code)
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];

  const filteredSpatials =
    spatials?.filter((spatial) =>
      spatial.spatial.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const filteredHecRas =
    hecRas?.filter((hecRasItem) =>
      hecRasItem.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const [map, setMap] = useState<Map | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("Бассейн");
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedSpatials, setSelectedSpatials] = useState<number[]>([]);
  const [selectedHecRas, setSelectedHecRas] = useState<string[]>([]);

  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setGeojson(parsed);
      } catch {
        alert("Некорректный GeoJSON");
      }
    };
    reader.readAsText(file);
  };

  const toggleSite = (id: number) => {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSpatial = (id: number) => {
    setSelectedSpatials((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleHecRas = (id: string) => {
    setSelectedHecRas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!updatePoolModal || !editingPool) return;

    setName(editingPool.name || "");
    setGeojson(editingPool.geojson || null);
    setDescription(editingPool.description || "Бассейн");
    setSelectedSites(editingPool.sites?.map((s) => s.id) || []);
    setSelectedSpatials(editingPool.spatials?.map((s) => s.id) ?? []);
    setSelectedHecRas(editingPool.hecRasIds || []);
  }, [updatePoolModal, editingPool]);

  const handleDelete = async () => {
    if (!editingPool) return;

    if (
      !confirm(`Вы уверены, что хотите удалить бассейн "${editingPool.name}"?`)
    )
      return;

    setLoading(true);
    try {
      const newPools = pools.filter((p) => p.id != editingPool.id);
      setPools(newPools);

      await api.get(`data/pools/delete?pool_id=${editingPool.id}`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      setSelectedSites([]);
      setSelectedSpatials([]);
      setSelectedHecRas([]);
      setName("");
      setGeojson(null);
      setDescription("Бассейн");

      toast.success("Бассейн удалён");
      setUpdatePoolModal(false);
    } catch {
      toast.error("Ошибка удаления бассейна");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!editingPool) return;

    setLoading(true);

    try {
      await api.post(
        `data/pools/update?pool_id=${editingPool.id}`,
        {
          name,
          description,
          geojson,
          siteIds: selectedSites,
          spatialIds: selectedSpatials,
          hecRasIds: selectedHecRas,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      toast.success("Бассейн обновлён");
      setUpdatePoolModal(false);

      setSelectedSites([]);
      setSelectedSpatials([]);
      setSelectedHecRas([]);
      setName("");
      setGeojson(null);
      setDescription("Бассейн");
    } catch {
      toast.error("Ошибка обновления бассейна");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!map || !geojson) return;

    try {
      const onLoad = () => {
        // Удаляем старые слои и источник
        if (map.getSource("geojson-preview")) {
          [
            "geojson-preview-fill",
            "geojson-preview-line",
            "geojson-preview-points",
          ].forEach((l) => {
            if (map.getLayer(l)) map.removeLayer(l);
          });
          map.removeSource("geojson-preview");
        }

        // Добавляем новый источник
        map.addSource("geojson-preview", { type: "geojson", data: geojson });

        // Слой для полигонов (заливка)
        map.addLayer({
          id: "geojson-preview-fill",
          type: "fill",
          source: "geojson-preview",
          paint: { "fill-color": "#1976d2", "fill-opacity": 0.2 },
          filter: ["==", "$type", "Polygon"],
        });

        // Слой для линий
        map.addLayer({
          id: "geojson-preview-line",
          type: "line",
          source: "geojson-preview",
          paint: { "line-color": "#1976d2", "line-width": 2 },
          filter: ["in", "$type", "Polygon", "LineString"],
        });

        // Слой для точек
        map.addLayer({
          id: "geojson-preview-points",
          type: "circle",
          source: "geojson-preview",
          paint: { "circle-radius": 5, "circle-color": "#1976d2" },
          filter: ["==", "$type", "Point"],
        });

        // Авто-центрирование
        if (
          geojson.type === "FeatureCollection" &&
          geojson.features.length > 0
        ) {
          const coords: number[][] = [];
          geojson.features.forEach((f) => {
            const g: Geometry | null = f.geometry;

            if (!g) return;
            switch (g.type) {
              case "Point":
                coords.push(g.coordinates as number[]);
                break;
              case "LineString":
                coords.push(...(g.coordinates as number[][]));
                break;
              case "Polygon":
                (g.coordinates as number[][][]).forEach((ring) =>
                  coords.push(...ring),
                );
                break;
              case "MultiPolygon":
                (g.coordinates as number[][][][]).forEach((poly) =>
                  poly.forEach((ring) => coords.push(...ring)),
                );
                break;
            }
          });

          if (coords.length) {
            const lons = coords.map((c) => c[0]);
            const lats = coords.map((c) => c[1]);
            const bounds: [[number, number], [number, number]] = [
              [Math.min(...lons), Math.min(...lats)],
              [Math.max(...lons), Math.max(...lats)],
            ];
            if (isFinite(bounds[0][0]) && isFinite(bounds[0][1])) {
              map.fitBounds(bounds, { padding: 20 });
            }
          }
        }
      };

      if (map.isStyleLoaded()) {
        onLoad();
      } else {
        map.once("load", onLoad);
      }

      return () => {
        map.off("load", onLoad);
      };
    } catch (err) {
      console.error("Map render error:", err);
    }
  }, [geojson, map]);

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Modal open={updatePoolModal} onClose={() => setUpdatePoolModal(false)}>
      <ModalBox className="relative w-5xl! overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/15 flex justify-center items-center z-50">
            <Loading />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Typography variant="h6">Редактирование бассейна</Typography>
          <Divider />
        </div>

        <div className="grid grid-cols-2 gap-6 h-124">
          <div className="flex flex-col gap-3">
            <Typography fontWeight={500}>Название</Typography>
            <TextField
              label="Название"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <Typography fontWeight={500}>Описание</Typography>
            <TextField
              label="Описание"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />

            <div className="mt-4 flex flex-col gap-3">
              <Typography fontWeight={500}>GeoJSON</Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
              >
                Загрузить GeoJSON
                <input
                  hidden
                  type="file"
                  accept=".geojson"
                  onChange={handleGeoJsonUpload}
                />
              </Button>

              <MapboxMap
                className="w-full min-h-64 rounded-xl"
                setMap={setMap}
                mapStyle="mapbox://styles/yeunikey/cmjj8gyo300am01qw2004ddag"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 overflow-y-scroll h-full">
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Точки" />
                <Tab label="Пространственные данные" />
                <Tab label="HEC-RAS проекты" />
              </Tabs>
            </Box>
            <TextField
              label="Поиск"
              size="small"
              value={search}
              variant="standard"
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              className="mb-3!"
            />

            {value == 0 && (
              <>
                {filteredSites.map((site) => (
                  <label
                    key={site.id}
                    className="flex items-center cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSites.includes(site.id)}
                      onChange={() => toggleSite(site.id)}
                    />
                    <span>{site.name + ` (${site.code})`}</span>
                  </label>
                ))}
              </>
            )}

            {value == 1 && (
              <>
                {filteredSpatials.map((spatial) => (
                  <label
                    key={spatial.spatial.id}
                    className="flex items-center cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSpatials.includes(spatial.spatial.id)}
                      onChange={() => toggleSpatial(spatial.spatial.id)}
                    />
                    <span>{spatial.spatial.name}</span>
                  </label>
                ))}
              </>
            )}

            {value == 2 && (
              <>
                {filteredHecRas.map((hecRas) => (
                  <label
                    key={hecRas.id}
                    className="flex items-center cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedHecRas.includes(hecRas.id)}
                      onChange={() => toggleHecRas(hecRas.id)}
                    />
                    <span>{hecRas.name}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>

        <Divider className="my-4" />

        <div className="flex justify-end gap-2">
          <Button
            variant="outlined"
            color="error"
            className="mr-auto!"
            onClick={handleDelete}
          >
            Удалить
          </Button>
          <Button variant="outlined" onClick={() => setUpdatePoolModal(false)}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!name}>
            Сохранить
          </Button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export default UpdatePoolModal;
