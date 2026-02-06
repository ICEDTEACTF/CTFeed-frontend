import { APP_CONFIG } from "../config";

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const url = `${APP_CONFIG.apiBaseUrl}${path}`;
  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });
    const contentType = response.headers.get("content-type") ?? "";
    const hasJson = contentType.includes("application/json");
    const data = hasJson ? await response.json() : null;
    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : `HTTP ${response.status}`;
      return { ok: false, status: response.status, data: null, error: message };
    }
    return { ok: true, status: response.status, data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, status: 0, data: null, error: message };
  }
}
