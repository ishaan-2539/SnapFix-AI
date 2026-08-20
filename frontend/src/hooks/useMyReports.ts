import { useCallback, useEffect, useState } from "react";

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
 * The API contract has no auth/user model, so "my reports" is tracked client-side:
 * every report ID this browser has successfully submitted (or merged into) is
 * remembered locally, most recent first.
 */
export function useMyReports() {
  const [ids, setIds] = useState<number[]>(() => readIds());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const addReportId = useCallback((id: number) => {
    setIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  }, []);

  return { myReportIds: ids, addReportId };
}
