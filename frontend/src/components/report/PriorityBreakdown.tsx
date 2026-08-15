import { useState } from "react";
import type { ElementType } from "react";
import { ChevronDown, ChevronUp, Calculator, School, HeartPulse, Route, Users2 } from "lucide-react";

interface PriorityBreakdownProps {
  breakdown: Record<string, any> | null;
  finalScore: number;
}

interface Factor {
  label: string;
  detail: string;
  modifier: number;
  icon: ElementType;
}

export function PriorityBreakdown({ breakdown, finalScore }: PriorityBreakdownProps) {
  const [expanded, setExpanded] = useState(true);

  if (!breakdown) return null;

  const baseSeverity = Number(breakdown.base_severity ?? 0);

  const factors: Factor[] = [
    {
      label: "School proximity",
      detail:
        breakdown.school_proximity?.distance_meters != null
          ? `${Math.round(breakdown.school_proximity.distance_meters)}m from nearest school`
          : "No school nearby",
      modifier: Number(breakdown.school_proximity?.modifier ?? 0),
      icon: School,
    },
    {
      label: "Hospital proximity",
      detail:
        breakdown.hospital_proximity?.distance_meters != null
          ? `${Math.round(breakdown.hospital_proximity.distance_meters)}m from nearest hospital`
          : "No hospital nearby",
      modifier: Number(breakdown.hospital_proximity?.modifier ?? 0),
      icon: HeartPulse,
    },
    {
      label: "Major road proximity",
      detail:
        breakdown.major_road_proximity?.distance_meters != null
          ? `${Math.round(breakdown.major_road_proximity.distance_meters)}m from a major road`
          : "Not near a major road",
      modifier: Number(breakdown.major_road_proximity?.modifier ?? 0),
      icon: Route,
    },
    {
      label: "Community corroboration",
      detail: breakdown.community_corroboration?.additional_reports
        ? `${breakdown.community_corroboration.additional_reports} additional confirmation${
            breakdown.community_corroboration.additional_reports === 1 ? "" : "s"
          }`
        : "Reported once, not yet confirmed",
      modifier: Number(breakdown.community_corroboration?.modifier ?? 0),
      icon: Users2,
    },
  ];

  return (
    <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-brand-600" />
          <span className="font-display font-bold text-sm text-ink-900">Why this priority?</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-ink-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-1">
          <div className="flex items-center justify-between py-2 text-sm border-t border-ink-100">
            <span className="text-ink-600">Base severity (AI visual assessment)</span>
            <span className="font-semibold text-ink-900">{baseSeverity.toFixed(1)}</span>
          </div>

          {factors.map((f) => {
            const Icon = f.icon;
            const active = f.modifier > 0;
            return (
              <div
                key={f.label}
                className="flex items-center justify-between py-2 text-sm border-t border-ink-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-brand-600" : "text-ink-300"}`} />
                  <div className="min-w-0">
                    <p className={active ? "text-ink-700" : "text-ink-400"}>{f.label}</p>
                    <p className="text-xs text-ink-400 truncate">{f.detail}</p>
                  </div>
                </div>
                <span className={`font-semibold shrink-0 ml-2 ${active ? "text-brand-700" : "text-ink-300"}`}>
                  {f.modifier > 0 ? `+${f.modifier.toFixed(1)}` : "+0.0"}
                </span>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-ink-900">
            <span className="font-display font-bold text-ink-900 text-sm">Final priority score</span>
            <span className="font-display font-extrabold text-lg text-brand-700">
              {finalScore.toFixed(1)} / 10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}