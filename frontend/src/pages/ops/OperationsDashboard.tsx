import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  FileWarning,
  Flame,
  CheckCircle2,
  Gauge,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Timer,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ops/KpiCard";
import { IncidentCard } from "@/components/ops/IncidentCard";
import { PriorityBadge } from "@/components/report/IssueBadges";
import { StatCardSkeleton, MapSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, extractErrorMessage } from "@/lib/api";
import { statusMarkerIcon, createClusterIcon } from "@/lib/mapIcons";
import type { AnalyticsStats, MapPin, ReportResponse } from "@/types/api";

const DEFAULT_CENTER: [number, number] = [28.6469, 77.391];

function healthLabel(stats: AnalyticsStats | null): { label: string; tone: string } {
  if (!stats || stats.total_reports === 0) return { label: "No data yet", tone: "bg-ink-100 text-ink-600" };
  const resolvedRate = stats.resolved_reports / stats.total_reports;
  if (resolvedRate >= 0.6) return { label: "Improving", tone: "bg-ok-50 text-ok-700" };
  if (resolvedRate >= 0.3) return { label: "Stable", tone: "bg-warn-50 text-warn-700" };
  return { label: "Needs attention", tone: "bg-danger-50 text-danger-700" };
}

export default function OperationsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.getMapPins(), api.listReports()])
      .then(([s, p, r]) => {
        setStats(s);
        setPins(p);
        setReports(r);
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const topPriority = useMemo(
    () =>
      [...reports]
        .filter((r) => r.status !== "RESOLVED")
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 5),
    [reports]
  );

  // No `updated_at`/`resolved_at` field exists in the API contract, so "recently"
  // resolved is approximated by report ID (higher id = created more recently),
  // not by actual resolution time.
  const recentlyResolved = useMemo(
    () =>
      [...reports]
        .filter((r) => r.status === "RESOLVED")
        .sort((a, b) => b.id - a.id)
        .slice(0, 4),
    [reports]
  );
  // SLA-weighted ranking: priority score plus an age bonus, capped so old
  // low-priority tickets can't outrank something genuinely urgent today.
  const solveToday = useMemo(() => {
    const now = Date.now();
    return [...reports]
      .filter((r) => r.status !== "RESOLVED")
      .map((r) => {
        const ageDays = Math.max(0, (now - new Date(r.created_at).getTime()) / 86_400_000);
        const ageBonus = Math.min(ageDays * 0.4, 4);
        return { report: r, ageDays, urgency: r.priority_score + ageBonus };
      })
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 5);
  }, [reports]);
  // Active (non-resolved) count per category — stats.category_breakdown counts
  // every report regardless of status, so it isn't the right source for "active".
  const activeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    reports
      .filter((r) => r.status !== "RESOLVED")
      .forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  // stats.average_severity_score is a lifetime average across every report ever
  // submitted — it never moves just because things get resolved (a report's
  // severity_score is fixed at creation). For an operational "what's urgent
  // right now" KPI, average the severity of only currently-active reports.
  const activeAverageSeverity = useMemo(() => {
    const active = reports.filter((r) => r.status !== "RESOLVED");
    if (active.length === 0) return null;
    return active.reduce((sum, r) => sum + r.severity_score, 0) / active.length;
  }, [reports]);

  const topCategory = useMemo(() => {
    if (!stats) return null;
    const entries = Object.entries(stats.category_breakdown);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [stats]);

  const health = healthLabel(stats);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Greeting + health */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">{greeting}, Operations Team</h1>
          <p className="text-ink-500 text-sm mt-1">Here's what needs attention right now.</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${health.tone}`}>
          <Gauge className="w-4 h-4" />
          City Health: {health.label}
        </span>
      </div>

      {error && <Card className="p-4 border-danger-100 bg-danger-50 text-danger-700 text-sm">{error}</Card>}

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Reports Today" value={stats.total_reports} icon={FileWarning} tone="brand" />
            <KpiCard label="High Priority" value={reports.filter((r) => r.severity_score >= 8).length} icon={Flame} tone="danger" />
            <KpiCard label="Resolved" value={stats.resolved_reports} icon={CheckCircle2} tone="ok" />
            <KpiCard
              label="Average Severity (Active)"
              value={activeAverageSeverity !== null ? activeAverageSeverity.toFixed(1) : "—"}
              icon={Gauge}
              tone="warn"
              suffix={activeAverageSeverity !== null ? "/6" : undefined}
            />
          </div>
        )
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Live incident queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900 flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-brand-600" />
              Live Incident Queue
            </h2>
            <Link to="/ops/map" className="text-brand-600 text-xs font-semibold flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : topPriority.length === 0 ? (
            <Card>
              <EmptyState icon={CheckCircle2} title="Queue is clear" description="No open incidents right now." />
            </Card>
          ) : (
            <div className="space-y-3">
              {topPriority.map((r) => (
                <IncidentCard key={r.id} report={r} />
              ))}
            </div>
          )}
        </div>

        {/* Operations map */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900">Operations Map</h2>
            <Link to="/ops/map" className="text-brand-600 text-xs font-semibold flex items-center gap-1">
              Full screen <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Card className="overflow-hidden h-[420px]">
            {loading ? (
              <MapSkeleton />
            ) : (
              <MapContainer center={DEFAULT_CENTER} zoom={12} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MarkerClusterGroup chunkedLoading maxClusterRadius={45} iconCreateFunction={createClusterIcon}>
                  {pins.map((pin) => (
                    <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={statusMarkerIcon(pin)} />
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            )}
          </Card>
        </div>
      </div>
      {/* Solve Today — SLA dispatch queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink-900 flex items-center gap-2">
            <Timer className="w-4.5 h-4.5 text-danger-600" />
            Solve Today
          </h2>
          <span className="text-[11px] text-ink-400">Ranked by priority + time open</span>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : solveToday.length === 0 ? (
          <Card>
            <EmptyState icon={CheckCircle2} title="Nothing overdue" description="No open incidents need urgent dispatch today." />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {solveToday.map(({ report, ageDays }, i) => (
              <Card key={report.id} className="p-3.5 space-y-2 hover:shadow-elevated transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-danger-50 text-danger-700 text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <PriorityBadge score={report.priority_score} />
                </div>
                <p className="text-sm font-semibold text-ink-900 truncate">{report.category}</p>
                <p className="text-xs text-ink-500 line-clamp-2">{report.summary}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-ink-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ageDays < 1 ? "opened today" : `${Math.floor(ageDays)}d open`}
                  </span>
                  <Link to={`/ops/reports/${report.id}`} className="text-brand-600 text-[11px] font-semibold">
                    Dispatch →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Recently resolved */}
      {recentlyResolved.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-ink-900 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-ok-600" />
              Recently Resolved
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentlyResolved.map((r) => (
              <IncidentCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <Card className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 border-none">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-sm mb-1">AI Insights</h2>
            {topCategory ? (
              <p className="text-brand-50 text-sm leading-relaxed">
                <strong>{topCategory[0]}</strong> accounts for the most reports this period ({topCategory[1]} of{" "}
                {stats?.total_reports}). Consider allocating additional maintenance crews to that category.
              </p>
            ) : (
              <p className="text-brand-50 text-sm leading-relaxed">Not enough data yet to generate a recommendation.</p>
            )}
            <p className="text-brand-200 text-[11px] mt-2">Placeholder insight — full recommendations engine coming soon.</p>
          </div>
        </div>
      </Card>

      {/* Department performance teaser */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink-900">Department Performance</h2>
          <Link to="/ops/departments" className="text-brand-600 text-xs font-semibold flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {activeByCategory.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeByCategory.slice(0, 4).map(([cat, count]) => (
              <Card key={cat} className="p-4">
                <p className="text-xs font-semibold text-ink-500">{cat}</p>
                <p className="font-display font-extrabold text-2xl text-ink-900 mt-1">{count}</p>
                <p className="text-[11px] text-ink-400 mt-0.5">active cases</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
