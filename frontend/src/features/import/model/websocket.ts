import { Socket, io } from "socket.io-client";

import { api, socketUrl } from "@/shared/model/api/instance";
import { useCategorySelection } from "./useCategorySelection";
import { useImportStore } from "./useImportStore";
import { authHeader } from "@/shared/model/utils";
import { useAuth } from "@/shared/model/auth";
import Site from "@/entities/site/types/site";

const formData = async (savedSites: Site[]) => {
  const { rows, headers, headerVariableMap } = useImportStore.getState();

  // индекс datetime и code
  const datetimeIndex = headers.findIndex((h) => h === "datetime");
  const siteCodeIndex = headers.findIndex((h) => h === "code");

  // убираем datetime и code из headers
  const filteredHeaders = headers.filter(
    (h) => h !== "datetime" && h !== "code",
  );

  return rows.map((row) => {
    const siteCode = siteCodeIndex !== -1 ? row[siteCodeIndex] : null;
    const site = savedSites.find((s) => s.code === siteCode);

    return {
      siteId: site?.id ?? null,
      date_utc: datetimeIndex !== -1 ? row[datetimeIndex] : null,
      variables: filteredHeaders.map((h) => headerVariableMap[h] ?? null),
      values: filteredHeaders.map((h) => row[headers.indexOf(h)] ?? null),
    };
  });
};

async function saveSites() {
  const { sites, selectedType } = useImportStore.getState();
  const { token } = useAuth.getState();

  if (token === null) {
    throw new Error("No auth token");
  }

  const res = await api.post(
    "data/sites/bulk",
    sites.map((s) => ({
      ...s,
      longtitude: Number(s.longitude),
      latitude: Number(s.latitude),
      siteTypeId: selectedType?.id,
    })),
    authHeader(token),
  );

  return res.data.data;
}

const sendDataToServer = async (
  chunkSize: number,
  log: (msg: string) => void,
  setSentChunks: React.Dispatch<React.SetStateAction<number>>,
  setTotalChunks: (n: number) => void,
  setStartTime: (n: number) => void,
  setIsUploading: (b: boolean) => void,
) => {
  const { rows, headers } = useImportStore.getState();
  console.log({ rows, headers });
  log("Сохранение точек...");
  const savedSites = await saveSites();

  console.log(savedSites);

  const data = await formData(savedSites);
  const { selectedCategory } = useCategorySelection.getState();
  const { selectedQcl, selectedSource, selectedMethod } =
    useImportStore.getState();

  const total = data.length;
  const totalChunksCount = Math.ceil(total / chunkSize);

  setTotalChunks(totalChunksCount);
  setSentChunks(0);
  setStartTime(Date.now());

  let offset = 0;
  let chunkId = 0;
  setIsUploading(true);

  const socket: Socket = io(socketUrl, {
    transports: ["websocket"],
    path: "/ws",
    auth: {
      token: useAuth.getState().token,
    },
  });

  log("📡 Подключение к сокету...");

  const sendNextChunk = () => {
    if (offset >= total) {
      setIsUploading(false);
      log("✅ Все чанки успешно отправлены. Закрываю соединение.");
      socket.close();
      return;
    }

    const chunk = data.slice(offset, offset + chunkSize);

    const payload = {
      qclId: selectedQcl?.id ?? null,
      sourceId: selectedSource?.id ?? null,
      methodId: selectedMethod?.id ?? null,
      categoryId: selectedCategory?.id,

      chunks: chunk, // The requested structure
    };

    console.log(payload);

    socket.emit("upload_chunk", payload);
    log(`🚀 Чанк #${chunkId} отправлен (${offset} - ${offset + chunk.length})`);

    offset += chunk.length; // Correctly increment offset
    chunkId++;
  };

  socket.on("connect", () => {
    log("✅ Socket подключен");
    sendNextChunk();
  });

  socket.on(
    "upload_ack",
    (response: { status: number; chunkId: number; error?: string }) => {
      if (response.status === 200) {
        log(`✔️ Чанк #${response.chunkId} успешно принят сервером`);
        sendNextChunk();
        setSentChunks((prev) => prev + 1);
      } else {
        log(
          `❌ Ошибка при загрузке чанка #${response.chunkId}: ${response.error ?? "Неизвестная ошибка"}`,
        );
        setIsUploading(false);
        socket.close();
      }
    },
  );

  socket.on("disconnect", () => {
    log("🔌 Соединение закрыто");
  });

  socket.on("connect_error", (err) => {
    log(`❗ Ошибка подключения: ${err.message}`);
  });
};

export { formData, sendDataToServer };
