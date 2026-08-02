// Types mirror CivicSense_API_Contract.md exactly. Do not add fields that
// aren't confirmed live in the contract (e.g. no image_hash).

export type IssueCategory =
  | "Pothole"
  | "Trash/Garbage"
  | "Water Leak"
  | "Damaged Streetlight"
  | "Road Damage"
  | "Broken Sidewalk"
  | "Other";

export type ReportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface ReportResponse {
  id: number;
  image_url: string;
  latitude: number;
  longitude: number;
  category: string;
  severity_score: number; // 1-10
  summary: string;
  is_valid_civic_issue: boolean;
  upvotes: number;
  priority_score: number; // severity_score + (upvotes - 1)
  status: ReportStatus;
  created_at: string; // ISO 8601
}

export interface AnalyticsStats {
  total_reports: number;
  open_reports: number;
  in_progress_reports: number;
  resolved_reports: number;
  average_severity_score: number;
  category_breakdown: Record<string, number>;
}

export interface MapPin {
  id: number;
  latitude: number;
  longitude: number;
  category: string;
  severity_score: number;
  priority_score: number;
  upvotes: number;
  status: string;
  summary: string;
  image_url: string;
}

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
}

export interface ValidationErrorResponse {
  detail: ValidationErrorDetail[];
}

export interface BusinessErrorResponse {
  detail: string;
}

export type ApiErrorResponse = ValidationErrorResponse | BusinessErrorResponse;

export interface HealthResponse {
  status: string;
  database: string;
}
