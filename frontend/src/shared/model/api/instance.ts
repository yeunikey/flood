import xior from "xior";

export const defaultOptions: Record<string, string> = {
  "Content-Type": "application/json",
};

export const baseUrl =
  process.env.NEXT_PUBLIC_URL || "http://localhost:3001/v1";
// export const baseUrl =
//   process.env.NEXT_PUBLIC_URL || "https://panel-api.flood.astanait.edu.kz/v1";
export const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

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
