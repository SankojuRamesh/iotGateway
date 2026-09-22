import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;
/** Registered by AuthProvider so the interceptor can force a logout+redirect
 * without importing React context into this plain module. */
let onAuthExpired: (() => void) | null = null;
export function registerAuthExpiredHandler(handler: () => void) {
  onAuthExpired = handler;
}

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("No refresh token available");
  const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh,
  });
  const access = response.data.access as string;
  tokenStorage.setAccess(access);
  return access;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & {
      _retried?: boolean;
    }) | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const access = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStorage.clear();
        onAuthExpired?.();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: unknown }
      | Record<string, unknown>
      | undefined;
    if (data && typeof data === "object") {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (detail && typeof detail === "object") {
        const first = Object.values(detail as Record<string, unknown>)[0];
        if (Array.isArray(first)) return String(first[0]);
        if (typeof first === "string") return first;
      }
      const firstField = Object.values(data)[0];
      if (Array.isArray(firstField)) return String(firstField[0]);
    }
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}
