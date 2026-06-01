export const ok = <T>(data: T, statusCode = 200) => ({
  statusCode,
  data,
});
