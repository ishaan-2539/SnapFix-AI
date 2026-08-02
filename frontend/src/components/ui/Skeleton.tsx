import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function ReportCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-ink-200/70 shadow-card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden skeleton flex items-center justify-center">
      <span className="text-ink-400 text-sm font-medium bg-white/70 px-3 py-1.5 rounded-full">
        Loading map…
      </span>
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
