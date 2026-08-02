import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import { CardHover } from "@/components/ui/Card";
import { SeverityBadge, StatusBadge, UpvoteBadge } from "@/components/report/IssueBadges";
import { toImageUrl } from "@/lib/api";
import { categoryIcon, formatRelativeTime } from "@/lib/utils";
import type { ReportResponse } from "@/types/api";
import { useState } from "react";

export function ReportCard({ report }: { report: ReportResponse }) {
  const [imgError, setImgError] = useState(false);
  const CategoryIcon = categoryIcon(report.category);

  return (
    <Link to={`/app/reports/${report.id}`}>
      <CardHover className="overflow-hidden h-full flex flex-col">
        <div className="h-40 bg-ink-100 relative overflow-hidden">
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
              <ImageOff className="w-8 h-8" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5">
            <StatusBadge status={report.status} />
          </div>
          {report.upvotes > 1 && (
            <div className="absolute top-2.5 right-2.5 bg-ink-900/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
              +{report.upvotes - 1} confirms
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-ink-500 shrink-0" strokeWidth={2} />
            <h3 className="font-semibold text-ink-900 text-sm truncate">{report.category}</h3>
          </div>
          <p className="text-xs text-ink-500 line-clamp-2 flex-1">{report.summary}</p>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <SeverityBadge score={report.severity_score} />
            <UpvoteBadge count={report.upvotes} />
          </div>
          <span className="text-xs text-ink-400 font-medium">{formatRelativeTime(report.created_at)}</span>
        </div>
      </CardHover>
    </Link>
  );
}
