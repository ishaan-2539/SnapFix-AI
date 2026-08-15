import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, FileDown, ImageOff, Sparkles, AlertTriangle } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SeverityBadge, StatusBadge, PriorityBadge, UpvoteBadge,PriorityRatingBadge} from "@/components/report/IssueBadges";
import { api, extractErrorMessage, toImageUrl } from "@/lib/api";
import { categoryIcon, formatDateTime, googleMapsLink, severityHex } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";
import { ForensicTags } from "@/components/report/ForensicTags";


export default function ReportDetails() {
  const { id } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api
      .getReport(Number(id))
      .then(setReport)
      .catch((e) => setError(extractErrorMessage(e, "Report not found.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-danger-600" />
        </div>
        <h2 className="font-display font-bold text-lg text-ink-900">Report not found</h2>
        <p className="text-ink-500 text-sm mt-1.5">{error}</p>
        <Link to="/app/reports">
          <Button variant="outline" className="mt-6">
            Back to My Reports
          </Button>
        </Link>
      </div>
    );
  }

  const CategoryIcon = categoryIcon(report.category);
  const pinIcon = L.divIcon({
    className: "",
    html: `<div class="snap-marker" style="width:28px;height:28px;background:${severityHex(report.severity_score)}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/app/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to My Reports
      </Link>

      {/* Hero image + core badges */}
      <Card className="overflow-hidden mb-4">
        <div className="h-64 sm:h-80 bg-ink-100 relative">
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
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CategoryIcon className="w-5 h-5 text-brand-600" />
            <h1 className="font-display text-xl font-bold text-ink-900">{report.category}</h1>
            <span className="text-ink-300 text-sm ml-auto font-mono">#{report.id}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={report.status} />
            <PriorityRatingBadge score={report.priority_score} />
            <PriorityBadge score={report.priority_score} />
            <UpvoteBadge count={report.upvotes} />
            <ForensicTags
              hazards={report.hazards}
              affectedUsers={report.affected_users}
              repairComplexity={report.repair_complexity ?? "Unknown"}
              confidence={report.ai_confidence ?? 0}
              recommendedAction={report.recommended_action}
            />
          </div>
        </div>
      </Card>

      {/* AI Assessment */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h2 className="font-display font-bold text-ink-900 text-sm">AI Assessment</h2>
        </div>
        <p className="text-ink-600 text-sm leading-relaxed">{report.summary}</p>
      </Card>

      {/* Location */}
      <Card className="overflow-hidden mb-4">
        <div className="h-52">
          <MapContainer
            center={[report.latitude, report.longitude]}
            zoom={16}
            className="h-full w-full"
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[report.latitude, report.longitude]} icon={pinIcon} />
          </MapContainer>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <MapPin className="w-4 h-4 text-brand-600" />
            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
          </div>
          <a
            href={googleMapsLink(report.latitude, report.longitude)}
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 text-sm font-semibold hover:underline"
          >
            Open in Maps
          </a>
        </div>
      </Card>

      {/* Submission time */}
      <Card className="p-4 mb-4 flex items-center gap-2.5 text-sm text-ink-600">
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
  );
}
