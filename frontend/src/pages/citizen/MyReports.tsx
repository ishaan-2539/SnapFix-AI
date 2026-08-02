import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportCardSkeleton } from "@/components/ui/Skeleton";
import { ReportCard } from "@/components/report/ReportCard";
import { api } from "@/lib/api";
import { useMyReports } from "@/hooks/useMyReports";
import type { ReportResponse } from "@/types/api";

export default function MyReports() {
  const { myReportIds } = useMyReports();
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (myReportIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(myReportIds.map((id) => api.getReport(id).catch(() => null)))
      .then((results) => setReports(results.filter((r): r is ReportResponse => r !== null)))
      .finally(() => setLoading(false));
  }, [myReportIds]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">My Reports</h1>
          <p className="text-ink-500 text-sm mt-1">Every issue you've submitted from this device.</p>
        </div>
        <Link to="/app/report" className="hidden sm:block">
          <Button size="sm">
            <Camera className="w-4 h-4" />
            New report
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No Reports Yet"
          description="Reports you submit from this device will show up here so you can track their status."
          action={
            <Link to="/app/report">
              <Button>
                <Camera className="w-4 h-4" />
                Report your first issue
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
