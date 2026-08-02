import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, MapPin, TrendingUp, Users, ArrowRight, Award, Compass } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCardSkeleton, ReportCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportCard } from "@/components/report/ReportCard";
import { api, extractErrorMessage } from "@/lib/api";
import { useMyReports } from "@/hooks/useMyReports";
import type { AnalyticsStats, ReportResponse } from "@/types/api";

export default function CitizenHome() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [nearby, setNearby] = useState<ReportResponse[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { myReportIds } = useMyReports();

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setStatsLoading(false));

    api
      .listReports()
      .then((all) => setNearby(all.slice(0, 4)))
      .catch(() => {})
      .finally(() => setNearbyLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{greeting} 👋</h1>
        <p className="text-ink-500 text-sm mt-1">Ready to make your neighbourhood a little better?</p>
      </div>

      {/* Big report button */}
      <Link to="/app/report">
        <Card className="relative overflow-hidden bg-brand-600 border-none p-6 flex items-center gap-4 hover:shadow-floating transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Camera className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-display font-extrabold text-lg text-white">Report an Issue</p>
            <p className="text-brand-100 text-sm">Snap a photo — AI does the rest</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/70 shrink-0" />
        </Card>
      </Link>

      {error && (
        <Card className="p-4 border-danger-100 bg-danger-50 text-danger-700 text-sm">{error}</Card>
      )}

      {/* Contribution cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center mb-2.5">
            <Award className="w-4.5 h-4.5 text-brand-600" />
          </div>
          <p className="font-display font-extrabold text-2xl text-ink-900">{myReportIds.length}</p>
          <p className="text-xs text-ink-500 font-medium mt-0.5">Your reports</p>
        </Card>
        <Card className="p-4">
          <div className="w-9 h-9 rounded-xl bg-ok-50 flex items-center justify-center mb-2.5">
            <TrendingUp className="w-4.5 h-4.5 text-ok-600" />
          </div>
          <p className="font-display font-extrabold text-2xl text-ink-900">
            {myReportIds.length > 0 ? "Active" : "—"}
          </p>
          <p className="text-xs text-ink-500 font-medium mt-0.5">Contribution status</p>
        </Card>
      </div>

      {/* Community statistics */}
      <div>
        <h2 className="font-display font-bold text-ink-900 mb-3">Community statistics</h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-ink-400" />
                <p className="text-xs text-ink-500 font-semibold">City-wide reports</p>
              </div>
              <p className="font-display font-extrabold text-2xl text-ink-900 tabular-nums">{stats.total_reports}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-ink-400" />
                <p className="text-xs text-ink-500 font-semibold">Resolved</p>
              </div>
              <p className="font-display font-extrabold text-2xl text-ok-600 tabular-nums">{stats.resolved_reports}</p>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Nearby activity / recent reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-ink-900">Nearby activity</h2>
          <Link to="/app/map" className="text-brand-600 text-sm font-semibold flex items-center gap-1">
            View map <MapPin className="w-3.5 h-3.5" />
          </Link>
        </div>
        {nearbyLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </div>
        ) : nearby.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {nearby.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Compass}
              title="No nearby issues"
              description="Nothing reported near you yet. Be the first to flag something."
              action={
                <Link to="/app/report">
                  <Button size="sm">Report an issue</Button>
                </Link>
              }
            />
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/map">
          <Card className="p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow">
            <MapPin className="w-5 h-5 text-brand-600" />
            <span className="text-sm font-semibold text-ink-800">City Map</span>
          </Card>
        </Link>
        <Link to="/app/reports">
          <Card className="p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow">
            <Award className="w-5 h-5 text-brand-600" />
            <span className="text-sm font-semibold text-ink-800">My Reports</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
