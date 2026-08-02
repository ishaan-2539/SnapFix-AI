import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-ink-200/70 shadow-card",
        className
      )}
      {...props}
    />
  );
}

export function CardHover({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-ink-200/70 shadow-card transition-all duration-200",
        "hover:shadow-elevated hover:-translate-y-0.5 hover:border-ink-300/70",
        className
      )}
      {...props}
    />
  );
}
