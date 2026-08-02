import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, extractErrorMessage } from "@/lib/api";
import { categoryIcon } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";

interface DeptStat {
  category: string;
  total: number;
  resolved: number;
  active: number;
  completionRate: number;
}

export default function Departments() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listReports()
      .then(setReports)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const deptStats = useMemo<DeptStat[]>(() => {
    const map = new Map<string, DeptStat>();
    reports.forEach((r) => {
      const existing = map.get(r.category) ?? { category: r.category, total: 0, resolved: 0, active: 0, completionRate: 0 };
      existing.total += 1;
      if (r.status === "RESOLVED") existing.resolved += 1;
      else existing.active += 1;
      map.set(r.category, existing);
    });
    return Array.from(map.values())
      .map((d) => ({ ...d, completionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [reports]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Department Performance</h1>
        <p className="text-ink-500 text-sm mt-1">Completion rate and active caseload by issue category.</p>
      </div>

      {error && <Card className="p-4 border-danger-100 bg-danger-50 text-danger-700 text-sm">{error}</Card>}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : deptStats.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="No department data yet" description="Categories will appear here once reports come in." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptStats.map((d) => {
            const Icon = categoryIcon(d.category);
            return (
              <Card key={d.category} className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-ink-900 text-sm">{d.category}</h3>
                </div>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-ink-500">Completion rate</span>
                  <span className="text-xs font-bold text-ink-900">{d.completionRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-ok-500 transition-all duration-500"
                    style={{ width: `${d.completionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-ink-50 rounded-xl py-2.5">
                    <p className="font-display font-extrabold text-lg text-ink-900">{d.active}</p>
                    <p className="text-[10px] text-ink-500 font-semibold mt-0.5">Active cases</p>
                  </div>
                  <div className="bg-ink-50 rounded-xl py-2.5">
                    <p className="font-display font-extrabold text-lg text-ink-400">—</p>
                    <p className="text-[10px] text-ink-500 font-semibold mt-0.5">Avg. resolution</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
