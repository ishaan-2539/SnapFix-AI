import axios, { AxiosError } from "axios";
import type {
  ReportResponse,
  PaginatedReportResponse,
  AnalyticsStats,
  MapPin,
  HealthResponse,
} from "@/types/api";
import { supabase } from "@/lib/supabase";

export const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";

export const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function toImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BASE_URL}${imageUrl}`;
}

export function extractErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<unknown>;
    const detail = (ax.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string; loc?: (string | number)[] };
      const field = first?.loc?.[first.loc.length - 1];
      return field ? `${field}: ${first.msg ?? "invalid value"}` : first?.msg ?? fallback;
    }
    if (ax.code === "ERR_NETWORK") {
      return "Can't reach the SnapFix server. Make sure the backend is running.";
    }
  }
  return fallback;
}

export const api = {
  health: async (): Promise<HealthResponse> => {
    const { data } = await client.get<HealthResponse>("/health");
    return data;
  },

  updateReportStatus: async (id: number, status: ReportResponse["status"]): Promise<ReportResponse> => {
    const { data } = await client.patch<ReportResponse>(`/api/v1/reports/${id}/status`, { status });
    return data;
  },

  submitReport: async (
    file: File,
    latitude?: number | null,
    longitude?: number | null,
    onProgress?: (pct: number) => void
  ): Promise<ReportResponse> => {
    const form = new FormData();
    form.append("file", file);
    if (latitude != null) form.append("latitude", String(latitude));
    if (longitude != null) form.append("longitude", String(longitude));
    const { data } = await client.post<ReportResponse>("/api/v1/reports/", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return data;
  },

  listReports: async (page = 1, size = 20): Promise<ReportResponse[]> => {
    const { data } = await client.get<PaginatedReportResponse>("/api/v1/reports/", {
      params: { page, size },
    });
    return data.items;
  },

  getReport: async (id: number): Promise<ReportResponse> => {
    const { data } = await client.get<ReportResponse>(`/api/v1/reports/${id}`);
    return data;
  },

  getMyReports: async (): Promise<ReportResponse[]> => {
    const { data } = await client.get<ReportResponse[]>("/api/v1/reports/mine");
    return data;
  },

  pdfUrl: (id: number): string => `${BASE_URL}/api/v1/reports/${id}/pdf`,

  getStats: async (): Promise<AnalyticsStats> => {
    const { data } = await client.get<AnalyticsStats>("/api/v1/analytics/stats");
    return data;
  },

  getMapPins: async (): Promise<MapPin[]> => {
    const { data } = await client.get<MapPin[]>("/api/v1/analytics/map-pins");
    return data;
  },
};