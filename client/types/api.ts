// API Response types
export interface ApiResponse<T> {
  status: "success" | "error";
  response: T;
  error?: string;
}
