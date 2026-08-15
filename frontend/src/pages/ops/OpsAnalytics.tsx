import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, MapPinned } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, extractErrorMessage } from "@/lib/api";
import { severityTier, haversineMeters } from "@/lib/utils";
import type { AnalyticsStats, ReportResponse, ReportStatus } from "@/types/api";

const SEVERITY_COLORS: Record<string, string> = { low: "#16a34a", medium: "#f59e0b", high: "#dc2626" };
const CATEGORY_COLORS = ["#2563eb", "#60a5fa", "#16a34a", "#f59e0b", "#dc2626", "#94a3b8", "#1e40af"];

export default function OpsAnalytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.listReports()])
      .then(([s, r]) => {
        setStats(s);
        setReports(r);
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const categoryData = useMemo(
    () => (stats ? Object.entries(stats.category_breakdown).map(([name, count]) => ({ name, count })) : []),
    [stats]
  );

  const severityData = useMemo(() => {
    const buckets = { low: 0, medium: 0, high: 0 };
    reports.forEach((r) => {
      buckets[severityTier(r.severity_score)]++;
    });
    return [
      { name: "Low", value: buckets.low, key: "low" },
      { name: "Medium", value: buckets.medium, key: "medium" },
      { name: "High", value: buckets.high, key: "high" },
    ].filter((d) => d.value > 0);
  }, [reports]);

  const trendData = useMemo(() => {
    const byDay = new Map<string, number>();
    reports.forEach((r) => {
      const day = new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    });
    return Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-14);
  }, [reports]);
  // Groups every report — any status, any point in time — that landed within
  // ~30m of the same category into one "location". 2+ reports at a location
  // means the issue was resolved and came straight back: a signal that
  // needs a root-cause fix, not another patch repair.
  const HOTSPOT_RADIUS_METERS = 30;

  const hotspots = useMemo(() => {
    const clusters: { category: string; lat: number; lng: number; reports: ReportResponse[] }[] = [];

    [...reports]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .forEach((r) => {
        const match = clusters.find(
          (c) =>
            c.category === r.category &&
            haversineMeters(c.lat, c.lng, r.latitude, r.longitude) <= HOTSPOT_RADIUS_METERS
        );
        if (match) match.reports.push(r);
        else clusters.push({ category: r.category, lat: r.latitude, lng: r.longitude, reports: [r] });
      });

    return clusters
      .filter((c) => c.reports.length >= 2)
      .map((c) => {
        const sorted = c.reports;
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const spanDays = (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) / 86_400_000;
        return {
          id: `${c.category}-${c.lat.toFixed(5)}-${c.lng.toFixed(5)}`,
          category: c.category,
          count: sorted.length,
          latitude: c.lat,
          longitude: c.lng,
          firstReported: first.created_at,
          lastReported: last.created_at,
          avgDaysBetween: sorted.length > 1 ? spanDays / (sorted.length - 1) : null,
          latestStatus: last.status as ReportStatus,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const repeatIssueRate = useMemo(() => {
    if (reports.length === 0) return null;
    const inHotspot = hotspots.reduce((sum, h) => sum + h.count, 0);
    return Math.round((inHotspot / reports.length) * 100);
  }, [hotspots, reports]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Analytics</h1>
        <p className="text-ink-500 text-sm mt-1">Trends across categories, severity, and time.</p>
      </div>

      {error && <Card className="p-4 border-danger-100 bg-danger-50 text-danger-700 text-sm">{error}</Card>}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : !stats || stats.total_reports === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title="No data to chart yet" description="Analytics will populate as reports come in." />
        </Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h2 className="font-display font-bold text-ink-900 text-sm mb-4">Category breakdown</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "#334155" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h2 className="font-display font-bold text-ink-900 text-sm mb-4">Severity distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {severityData.map((d) => (
                      <Cell key={d.key} fill={SEVERITY_COLORS[d.key]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    formatter={(v) => <span className="text-xs text-ink-600">{v}</span>}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-display font-bold text-ink-900 text-sm mb-4">Reports over time</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-ink-900 flex items-center gap-2">
                <MapPinned className="w-4.5 h-4.5 text-danger-600" />
                Deterioration Hotspots
              </h2>
              {repeatIssueRate !== null && (
                <span className="text-[11px] text-ink-400">{repeatIssueRate}% of all reports are repeat issues</span>
              )}
            </div>
            {hotspots.length === 0 ? (
              <Card>
                <EmptyState
                  icon={MapPinned}
                  title="No recurring locations yet"
                  description="Once the same issue is reported twice at one spot, it'll show up here."
                />
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotspots.map((h) => (
                  <Card key={h.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-900">{h.category}</span>
                      <Badge tone={h.count >= 3 ? "danger" : "warn"}>{h.count}× reported</Badge>
                    </div>
                    <p className="text-xs text-ink-500">
                      First seen{" "}
                      {new Date(h.firstReported).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · last "}
                      {new Date(h.lastReported).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    {h.avgDaysBetween !== null && (
                      <p className="text-xs text-ink-500">Recurs roughly every {Math.max(1, Math.round(h.avgDaysBetween))} days</p>
                    )}
                    <p className={`text-xs font-semibold ${h.count >= 3 ? "text-danger-700" : "text-warn-700"}`}>
                      {h.count >= 3
                        ? "Needs a permanent fix, not another patch repair."
                        : "Repeat issue — flag for root-cause inspection."}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${h.latitude},${h.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 text-[11px] font-semibold inline-block pt-1"
                    >
                      View location →
                    </a>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
