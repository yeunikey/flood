export const ok = <T>(data: T, statusCode = 200) => ({
  statusCode,
  data,
});

export const message = (messageText: string, statusCode: number) => ({
  statusCode,
  message: messageText,
});
