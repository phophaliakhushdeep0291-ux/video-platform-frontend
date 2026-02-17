import type { ApiResponse } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// If a custom API URL is explicitly set, always use it.
// Otherwise, only hit localhost:8000 if we're actually running on localhost.
// function checkBackendAvailable(): boolean {
//   if (process.env.NEXT_PUBLIC_API_URL) return true;
//   if (typeof window === "undefined") return false; // SSR - skip localhost calls
//   const hostname = window.location.hostname;
//   return hostname === "localhost" || hostname === "127.0.0.1";
// }

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // if (!checkBackendAvailable()) {
  //   throw new ApiError(
  //     "Backend is not available in this environment. Connect to your local backend to use full functionality.",
  //     0,
  //     { networkError: true, demo: true }
  //   );
  // }

  const url = `${BASE_URL}${endpoint}`;

  // BUG FIX: The original merged headers by spreading `options.headers` AFTER
  // the Content-Type default, which is correct. However it also spread `...options`
  // at the end of the config object — this re-spread `options.headers` as a top-
  // level key, silently overwriting the carefully merged `headers` object above
  // with the raw `options.headers` value. Result: the Content-Type was lost
  // whenever the caller passed custom headers.
  //
  // Fixed by building headers explicitly first, then spreading the rest of
  // options (excluding headers) so nothing overwrites the merged header map.
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    // Don't set Content-Type for FormData — the browser sets it automatically
    // with the correct multipart boundary.
    ...(!isFormData && { "Content-Type": "application/json" }),
    // Caller-supplied headers always win (allows overriding Content-Type)
    ...(options.headers as Record<string, string> | undefined),
  };

  const { headers: _omit, ...restOptions } = options;

  const config: RequestInit = {
    credentials: "include",
    ...restOptions,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(
      "Unable to connect to server. Please ensure the backend is running.",
      0,
      { networkError: true }
    );
  }

  if (!response.ok) {
    // BUG FIX: The original called `response.json()` unconditionally on error
    // responses, then fell back to `response.statusText` in the catch. However,
    // `response.json()` will throw on responses whose Content-Type isn't JSON
    // (e.g. HTML error pages from a proxy/CDN), and once the body stream is
    // consumed it cannot be read again. Using `response.text()` first and then
    // attempting to parse is safer and handles all content types.
    let errorData: { message?: string } | undefined;
    try {
      const text = await response.text();
      errorData = text ? JSON.parse(text) : undefined;
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      errorData?.message || "Something went wrong",
      response.status,
      errorData
    );
  }

  // BUG FIX: 204 No Content responses have an empty body — calling .json() on
  // them throws "Unexpected end of JSON input". Return undefined for empty bodies.
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type") ?? "";
  if (
    response.status === 204 ||
    contentLength === "0" ||
    !contentType.includes("application/json")
  ) {
    return undefined as unknown as T;
  }

  const data = await response.json();
  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<ApiResponse<T>>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<ApiResponse<T>>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<ApiResponse<T>>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<ApiResponse<T>>(endpoint, { method: "DELETE", ...options }),
};

export { ApiError };
export default api;
