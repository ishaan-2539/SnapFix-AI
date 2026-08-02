import { Link } from "react-router-dom";
import { X, ImageOff } from "lucide-react";
import { useState } from "react";
import { SeverityBadge, StatusBadge, UpvoteBadge } from "@/components/report/IssueBadges";
import { Button } from "@/components/ui/Button";
import { toImageUrl } from "@/lib/api";
import { categoryIcon } from "@/lib/utils";
import type { MapPin } from "@/types/api";

export function MarkerCard({
  pin,
  onClose,
  detailsBasePath = "/app/reports",
}: {
  pin: MapPin;
  onClose: () => void;
  detailsBasePath?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const CategoryIcon = categoryIcon(pin.category);

  return (
    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-floating border border-ink-200 overflow-hidden">
      <div className="relative h-40 bg-ink-100">
        {!imgError ? (
          <img
            src={toImageUrl(pin.image_url)}
            alt={pin.category}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">
            <ImageOff className="w-8 h-8" />
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/95 rounded-full shadow-elevated flex items-center justify-center text-ink-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <CategoryIcon className="w-4 h-4 text-brand-600" />
          <h3 className="font-display font-bold text-ink-900 text-sm flex-1">{pin.category}</h3>
        </div>
        <p className="text-xs text-ink-500 line-clamp-2 mb-3">{pin.summary}</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          <SeverityBadge score={pin.severity_score} />
          <StatusBadge status={pin.status} />
          <UpvoteBadge count={pin.upvotes} />
        </div>
        <Link to={`${detailsBasePath}/${pin.id}`}>
          <Button fullWidth size="sm">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
