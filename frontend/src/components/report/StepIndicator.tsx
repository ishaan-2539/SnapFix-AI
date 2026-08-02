import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const labels = ["Photo", "Location", "Review", "Submit"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {labels.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  isDone && "bg-brand-600 border-brand-600 text-white",
                  isActive && "border-brand-600 text-brand-600 bg-brand-50",
                  !isDone && !isActive && "border-ink-200 text-ink-400 bg-white"
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : step}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold hidden sm:block",
                  isActive ? "text-brand-700" : isDone ? "text-ink-600" : "text-ink-400"
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn("w-6 sm:w-10 h-0.5 rounded-full", isDone ? "bg-brand-600" : "bg-ink-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
