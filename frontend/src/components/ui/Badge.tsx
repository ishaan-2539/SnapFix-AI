import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "brand" | "ok" | "warn" | "danger" | "neutral";
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  ok: "bg-ok-50 text-ok-700 border-ok-100",
  warn: "bg-warn-50 text-warn-700 border-warn-100",
  danger: "bg-danger-50 text-danger-700 border-danger-100",
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusDot({ className }: { className?: string }) {
  return <span className={cn("w-1.5 h-1.5 rounded-full", className)} />;
}
