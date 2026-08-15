import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Construction,
  Trash2,
  Droplets,
  Lightbulb,
  Waves,
  Footprints,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { ReportStatus } from "@/types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Severity tier: green (low), orange (medium), red (high). Used everywhere — the
 * one visual language that ties the citizen and municipal apps together. */
export type SeverityTier = "low" | "medium" | "high";

export function severityTier(score: number): SeverityTier {
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}
export type PriorityTier = "low" | "medium" | "high" | "critical";

export function priorityTier(score: number): PriorityTier {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}
export const severityTokens: Record<
  SeverityTier,
  { text: string; bg: string; border: string; solid: string; ring: string; label: string }
> = {
  low: {
    text: "text-ok-700",
    bg: "bg-ok-50",
    border: "border-ok-100",
    solid: "bg-ok-500",
    ring: "ring-ok-500",
    label: "Low",
  },
  medium: {
    text: "text-warn-700",
    bg: "bg-warn-50",
    border: "border-warn-100",
    solid: "bg-warn-500",
    ring: "ring-warn-500",
    label: "Medium",
  },
  high: {
    text: "text-danger-700",
    bg: "bg-danger-50",
    border: "border-danger-100",
    solid: "bg-danger-500",
    ring: "ring-danger-500",
    label: "High",
  },
};

export function severityHex(score: number): string {
  const tier = severityTier(score);
  if (tier === "high") return "#dc2626";
  if (tier === "medium") return "#d97706";
  return "#16a34a";
}

export const statusTokens: Record<ReportStatus, { text: string; bg: string; label: string; dot: string }> = {
  OPEN: { text: "text-danger-700", bg: "bg-danger-50", label: "Open", dot: "bg-danger-500" },
  IN_PROGRESS: { text: "text-warn-700", bg: "bg-warn-50", label: "In Progress", dot: "bg-warn-500" },
  RESOLVED: { text: "text-ok-700", bg: "bg-ok-50", label: "Resolved", dot: "bg-ok-500" },
};

export function statusLabel(status: string): string {
  const known = statusTokens[status as ReportStatus];
  if (known) return known.label;
  return status;
}

const categoryIcons: Record<string, LucideIcon> = {
  Pothole: Construction,
  "Trash/Garbage": Trash2,
  "Water Leak": Droplets,
  "Damaged Streetlight": Lightbulb,
  "Road Damage": Waves,
  "Broken Sidewalk": Footprints,
  Other: AlertTriangle,
};

export function categoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? AlertTriangle;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
/** Great-circle distance in meters — mirrors the backend's haversine calc. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}