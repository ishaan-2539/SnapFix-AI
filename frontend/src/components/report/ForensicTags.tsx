import {
  AlertTriangle,
  Users,
  Wrench,
  ShieldCheck,
  Sparkles,
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
      {/* Quick stats: AI confidence + repair complexity, paired so they read as one glance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-ink-50 p-3">
          <div className="flex items-center gap-1.5 text-ink-500 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            AI Confidence
          </div>
          <p className="font-display font-extrabold text-lg text-ink-900">
            {Math.round(confidence * 100)}%
          </p>
        </div>

        <div className="rounded-xl bg-ink-50 p-3">
          <div className="flex items-center gap-1.5 text-ink-500 text-xs font-semibold mb-1">
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            Repair Complexity
          </div>
          <p className="font-display font-extrabold text-lg text-ink-900">
            {repairComplexity}
          </p>
        </div>
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

      {/* Recommended action — the actionable takeaway, so it gets real visual weight
          instead of reading as a footnote under a divider. */}
      {recommendedAction && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">
              Recommended Action
            </span>
          </div>
          <p className="text-sm text-ink-700 leading-relaxed">
            {recommendedAction}
          </p>
        </div>
      )}
    </div>
  );
}