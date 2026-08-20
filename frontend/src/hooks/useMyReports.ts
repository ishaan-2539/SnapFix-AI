import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "snapfix.myReportIds";

function readIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/**
 * "My reports" has two sources depending on auth state:
 *
 * - Logged in: the backend knows which reports belong to this account
 *   (GET /reports/mine, scoped server-side by reporter_id), so that's
 *   the source of truth.
 * - Guest/anonymous: there's no reporter_id to scope by, so we fall back
 *   to the original behavior — every report ID this browser has
 *   successfully submitted (or merged into) is remembered in
 *   localStorage, most recent first.
 *
 * The returned shape ({ myReportIds, addReportId }) is unchanged from
 * before, so existing callers (CitizenHome, MyReports, ReportWizard)
 * don't need to change.
 */
export function useMyReports() {
  const { session } = useAuth();
  const [localIds, setLocalIds] = useState<number[]>(() => readIds());
  // null = "not fetched yet" or "fetch failed" -> callers should fall back to localIds
  const [remoteIds, setRemoteIds] = useState<number[] | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localIds));
  }, [localIds]);

  useEffect(() => {
    if (!session) {
      setRemoteIds(null);
      return;
    }
    let cancelled = false;
    api
      .getMyReports()
      .then((reports) => {
        if (!cancelled) setRemoteIds(reports.map((r) => r.id));
      })
      .catch(() => {
        // Backend hiccup or not-yet-migrated environment — fall back to
        // the localStorage list rather than showing an empty page.
        if (!cancelled) setRemoteIds(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const addReportId = useCallback((id: number) => {
    setLocalIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
    // Optimistically reflect a fresh submission in the already-loaded
    // remote list too, so it shows up immediately without waiting on a refetch.
    setRemoteIds((prev) => (prev && !prev.includes(id) ? [id, ...prev] : prev));
  }, []);

  const myReportIds = session && remoteIds !== null ? remoteIds : localIds;

  return { myReportIds, addReportId };
}