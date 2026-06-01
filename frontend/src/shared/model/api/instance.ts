import xior, { XiorInterceptorRequestConfig } from "xior";

export const defaultOptions: Record<string, string> = {
  "Content-Type": "application/json",
};

export const baseUrl =
  process.env.NEXT_PUBLIC_URL || "https://panel-api.flood.astanait.edu.kz/v1";
export const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://panel-api.flood.astanait.edu.kz/";

export const api = xior.create({
  baseURL: baseUrl,
  headers: defaultOptions,
});

export const apiWithToken = xior.create({
  baseURL: baseUrl,
  headers: defaultOptions,
});

export const vapi = xior.create({
  baseURL: baseUrl,
});

function readTokenCookie() {
  if (typeof document === "undefined") return null;

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  return token ? decodeURIComponent(token) : null;
}

function attachAuthHeader(config: XiorInterceptorRequestConfig) {
  const token = readTokenCookie();

  if (!token) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

api.interceptors.request.use(attachAuthHeader);
apiWithToken.interceptors.request.use(attachAuthHeader);
vapi.interceptors.request.use(attachAuthHeader);
