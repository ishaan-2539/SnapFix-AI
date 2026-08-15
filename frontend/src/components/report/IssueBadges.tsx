import { Flame, TrendingUp, Users } from "lucide-react";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { severityTier, severityTokens, statusTokens,priorityTier } from "@/lib/utils";
import type { ReportStatus } from "@/types/api";

export function SeverityBadge({ score }: { score: number }) {
  const tier = severityTier(score);
  const t = severityTokens[tier];
  return (
    <Badge className={`${t.bg} ${t.text} ${t.border}`}>
      <Flame className="w-3 h-3" />
      {t.label} · {score}/6
    </Badge>
  );
}
export function PriorityRatingBadge({ score }: { score: number }) {
  const tier = priorityTier(score);

  const styles = {
    low: {
      text: "text-ok-700",
      bg: "bg-ok-50",
      border: "border-ok-100",
      label: "Low",
    },
    medium: {
      text: "text-warn-700",
      bg: "bg-warn-50",
      border: "border-warn-100",
      label: "Medium",
    },
    high: {
      text: "text-danger-700",
      bg: "bg-danger-50",
      border: "border-danger-100",
      label: "High",
    },
    critical: {
      text: "text-danger-700",
      bg: "bg-danger-50",
      border: "border-danger-100",
      label: "Critical",
    },
  };

  const t = styles[tier];

  return (
    <Badge className={`${t.bg} ${t.text} ${t.border}`}>
      <TrendingUp className="w-3 h-3" />
      {t.label} · {score}/10
    </Badge>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const t = statusTokens[status as ReportStatus] ?? {
    text: "text-ink-700",
    bg: "bg-ink-100",
    label: status,
    dot: "bg-ink-400",
  };
  return (
    <Badge className={`${t.bg} ${t.text} border-transparent`}>
      <StatusDot className={t.dot} />
      {t.label}
    </Badge>
  );
}

export function PriorityBadge({ score }: { score: number }) {
  return (
    <Badge tone="brand">
      <TrendingUp className="w-3 h-3" />
      Priority {score}
    </Badge>
  );
}

/** Community confirmations — how many citizens reported/confirmed this exact issue. */
export function UpvoteBadge({ count }: { count: number }) {
  return (
    <Badge tone="neutral">
      <Users className="w-3 h-3" />
      {count} {count === 1 ? "report" : "confirms"}
    </Badge>
  );
}
