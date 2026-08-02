import { Link } from "react-router-dom";
import { ImageOff, Clock } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeverityBadge, StatusBadge, PriorityBadge, UpvoteBadge } from "@/components/report/IssueBadges";
import { toImageUrl } from "@/lib/api";
import { categoryIcon, formatRelativeTime } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";

export function IncidentCard({ report }: { report: ReportResponse }) {
  const [imgError, setImgError] = useState(false);
  const CategoryIcon = categoryIcon(report.category);

  return (
    <Card className="p-3.5 flex gap-3.5 hover:shadow-elevated transition-shadow duration-200">
      <div className="w-20 h-20 rounded-xl bg-ink-100 overflow-hidden shrink-0">
        {!imgError ? (
          <img
            src={toImageUrl(report.image_url)}
            alt={report.category}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <CategoryIcon className="w-3.5 h-3.5 text-ink-500 shrink-0" />
            <h3 className="font-semibold text-sm text-ink-900 truncate">{report.category}</h3>
          </div>
          <span className="text-[11px] text-ink-400 shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(report.created_at)}
          </span>
        </div>
        <p className="text-xs text-ink-500 line-clamp-1 mt-1">{report.summary}</p>
        <div className="flex items-center gap-1.5 mt-auto pt-2 flex-wrap">
          <SeverityBadge score={report.severity_score} />
          <StatusBadge status={report.status} />
          <PriorityBadge score={report.priority_score} />
          <UpvoteBadge count={report.upvotes} />
          <Link to={`/ops/reports/${report.id}`} className="ml-auto shrink-0">
            <Button size="sm" variant="outline">
              Review
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
