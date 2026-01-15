interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

export default ApiResponse;
