const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  errors?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  statusCode: number;
  error: string;
  errors?: Record<string, string[]>;

  constructor(data: ApiError) {
    super(data.message);
    this.name = "ApiRequestError";
    this.statusCode = data.statusCode;
    this.error = data.error;
    this.errors = data.errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(data as ApiError);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
