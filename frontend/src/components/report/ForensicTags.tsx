import {
  AlertTriangle,
  Users,
  Wrench,
  ShieldCheck,
} from "lucide-react";

interface ForensicTagsProps {
  hazards: string[];
  affectedUsers: string[];
  repairComplexity: string;
  confidence: number;
  recommendedAction?: string | null;
}

export function ForensicTags({
  hazards,
  affectedUsers,
  repairComplexity,
  confidence,
  recommendedAction,
}: ForensicTagsProps) {
  return (
    <div className="space-y-4">
      {/* AI Confidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span className="text-sm font-semibold text-ink-800">
            AI Confidence
          </span>
        </div>

        <span className="text-sm font-bold text-ink-900">
          {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Hazards */}
      {hazards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
            <span className="text-sm font-semibold text-ink-800">
              Detected Hazards
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {hazards.map((hazard) => (
              <span
                key={hazard}
                className="px-2.5 py-1 rounded-full bg-danger-50 text-danger-700 border border-danger-100 text-xs font-semibold"
              >
                {hazard}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Affected users */}
      {affectedUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-ink-800">
              Potentially Affected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {affectedUsers.map((user) => (
              <span
                key={user}
                className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs font-semibold"
              >
                {user}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Repair complexity */}
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-ink-500" />
        <span className="text-sm text-ink-600">
          Repair complexity:
        </span>

        <span className="text-sm font-bold text-ink-900">
          {repairComplexity}
        </span>
        {recommendedAction && (
        <div className="pt-3 border-t border-ink-100">
            <div className="text-sm font-semibold text-ink-800 mb-1">
            Recommended Action
            </div>

            <p className="text-sm text-ink-600 leading-relaxed">
            {recommendedAction}
            </p>
        </div>
        )}
      </div>
    </div>

    
  );
}