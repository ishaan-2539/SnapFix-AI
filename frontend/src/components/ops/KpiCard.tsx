import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "danger" | "ok" | "warn" | "neutral";
  suffix?: string;
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-600",
  danger: "bg-danger-50 text-danger-600",
  ok: "bg-ok-50 text-ok-600",
  warn: "bg-warn-50 text-warn-600",
  neutral: "bg-ink-100 text-ink-600",
};

export function KpiCard({ label, value, icon: Icon, tone = "brand", suffix }: KpiCardProps) {
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow duration-200">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", toneClasses[tone])}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="font-display font-extrabold text-2xl text-ink-900 tabular-nums leading-none">
          {value}
          {suffix && <span className="text-base text-ink-400 font-semibold ml-0.5">{suffix}</span>}
        </p>
        <p className="text-xs text-ink-500 font-semibold mt-1.5 truncate">{label}</p>
      </div>
    </Card>
  );
}
