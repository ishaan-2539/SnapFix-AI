import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, FileDown, ImageOff, Sparkles, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SeverityBadge, StatusBadge, PriorityBadge, UpvoteBadge } from "@/components/report/IssueBadges";
import { StatusStepper } from "@/components/report/StatusStepper";
import { api, extractErrorMessage, toImageUrl } from "@/lib/api";
import { categoryIcon, formatDateTime, googleMapsLink } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";

export default function OpsReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getReport(Number(id))
      .then(setReport)
      .catch((e) => setError(extractErrorMessage(e, "Report not found.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-danger-500 mx-auto mb-3" />
        <h2 className="font-display font-bold text-lg text-ink-900">Report not found</h2>
        <p className="text-ink-500 text-sm mt-1.5">{error}</p>
        <Link to="/ops">
          <Button variant="outline" className="mt-6">Back to Operations</Button>
        </Link>
      </div>
    );
  }

  const CategoryIcon = categoryIcon(report.category);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link to="/ops" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Operations
      </Link>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="overflow-hidden">
          <div className="h-64 md:h-full bg-ink-100">
            {!imgError ? (
              <img
                src={toImageUrl(report.image_url)}
                alt={report.category}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-300">
                <ImageOff className="w-10 h-10" />
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CategoryIcon className="w-5 h-5 text-brand-600" />
              <h1 className="font-display text-xl font-bold text-ink-900">{report.category}</h1>
              <span className="text-ink-300 text-sm ml-auto font-mono">#{report.id}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={report.status} />
              <SeverityBadge score={report.severity_score} />
              <PriorityBadge score={report.priority_score} />
              <UpvoteBadge count={report.upvotes} />
            </div>
          </Card>

          <StatusStepper report={report} onUpdated={setReport} />

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-bold text-ink-900 text-sm">AI Assessment</h2>
            </div>
            <p className="text-ink-600 text-sm leading-relaxed">{report.summary}</p>
          </Card>

          <Card className="p-4 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-600">
              <MapPin className="w-4 h-4 text-brand-600" />
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </span>
            <a href={googleMapsLink(report.latitude, report.longitude)} target="_blank" rel="noreferrer" className="text-brand-600 font-semibold hover:underline">
              Open in Maps
            </a>
          </Card>

          <Card className="p-4 flex items-center gap-2.5 text-sm text-ink-600">
            <Clock className="w-4 h-4 text-ink-400" />
            Submitted {formatDateTime(report.created_at)}
          </Card>

          <a href={api.pdfUrl(report.id)} target="_blank" rel="noreferrer">
            <Button fullWidth size="lg">
              <FileDown className="w-4 h-4" />
              Download Work Order (PDF)
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
