import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  "Uploading image",
  "Analyzing infrastructure",
  "Detecting issue",
  "Estimating severity",
  "Checking nearby reports",
  "Generating report",
];

export function SubmittingStep({ done }: { done: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (done) {
      setActiveIndex(stages.length);
      return;
    }
    const interval = setInterval(() => {
      setActiveIndex((i) => (i < stages.length - 2 ? i + 1 : i));
    }, 1900);
    return () => clearInterval(interval);
  }, [done]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
        <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-extrabold text-brand-700 text-sm tabular-nums">
            {Math.min(Math.round(((activeIndex + 1) / stages.length) * 100), 99)}%
          </span>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {stages.map((stage, i) => {
          const isDone = i < activeIndex || done;
          const isActive = i === activeIndex && !done;
          return (
            <div key={stage} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-ok-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-4.5 h-4.5 text-brand-600 animate-spin shrink-0" />
              ) : (
                <span className="w-4.5 h-4.5 rounded-full border-2 border-ink-200 shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isDone && "text-ink-400 line-through decoration-ink-300",
                  isActive && "text-ink-900 font-semibold",
                  !isDone && !isActive && "text-ink-300"
                )}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-ink-400 mt-8 text-center max-w-xs">
        This can take a few seconds while our AI examines the photo closely.
      </p>
    </div>
  );
}
