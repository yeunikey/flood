"use client";

import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { ApiKeyInfo, GeneratedApiKey } from "./types";

export function useApiKey() {
  const { token } = useAuth();
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [generatedKey, setGeneratedKey] = useState("");

  useEffect(() => {
    if (!token) return;

    api
      .get<ApiKeyInfo>("auth/api-key")
      .then(({ data }) => setApiKeyInfo(data))
      .catch(() => setApiKeyInfo(null));
  }, [token]);

  const regenerateApiKey = async () => {
    const { data } = await api.post<GeneratedApiKey>("auth/api-key");

    setGeneratedKey(data.apiKey);
    setApiKeyInfo({
      hasApiKey: true,
      preview: data.preview,
      createdAt: data.createdAt,
    });
    toast.success("API ключ создан");
  };

  return {
    apiKeyInfo,
    generatedKey,
    regenerateApiKey,
    canGenerate: Boolean(token),
  };
}
