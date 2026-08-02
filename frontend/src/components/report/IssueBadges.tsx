import { Flame, TrendingUp, Users } from "lucide-react";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { severityTier, severityTokens, statusTokens } from "@/lib/utils";
import type { ReportStatus } from "@/types/api";

export function SeverityBadge({ score }: { score: number }) {
  const tier = severityTier(score);
  const t = severityTokens[tier];
  return (
    <Badge className={`${t.bg} ${t.text} ${t.border}`}>
      <Flame className="w-3 h-3" />
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
