import { useState } from "react";
import { Circle, Loader2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api, extractErrorMessage } from "@/lib/api";
import { cn, statusTokens } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import type { ReportResponse, ReportStatus } from "@/types/api";

const ORDER: ReportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

interface StatusStepperProps {
  report: ReportResponse;
  onUpdated: (next: ReportResponse) => void;
}

export function StatusStepper({ report, onUpdated }: StatusStepperProps) {
  const [pending, setPending] = useState<ReportStatus | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const { push } = useToast();

  const currentIndex = ORDER.indexOf(report.status);

  const setStatus = async (status: ReportStatus) => {
    if (status === report.status || pending) return;
    setPending(status);
    // Optimistic update — rolled back below if the backend rejects it.
    const previous = report;
    onUpdated({ ...report, status });
    try {
      const updated = await api.updateReportStatus(report.id, status);
      onUpdated(updated);
      push({ variant: "success", title: `Marked as ${statusTokens[status].label}`, description: `Issue #${report.id} updated.` });
    } catch (e) {
      onUpdated(previous); // roll back
      setUnsupported(true);
      push({
        variant: "error",
        title: "Couldn't update status",
        description: extractErrorMessage(e, "The backend doesn't support status updates yet."),
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="font-display font-bold text-ink-900 text-sm mb-4">Update status</h2>

      <div className="flex items-center mb-5">
        {ORDER.map((status, i) => {
          const isDone = i < currentIndex || (i === currentIndex && status === "RESOLVED");
          const isActive = i === currentIndex;
          const t = statusTokens[status];
          return (
            <div key={status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2",
                    isDone || isActive ? `${t.dot} border-transparent` : "border-ink-300 bg-white"
                  )}
                />
                <span className={cn("text-[10px] font-semibold", isActive ? t.text : "text-ink-400")}>{t.label}</span>
              </div>
              {i < ORDER.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1.5 -mt-4", i < currentIndex ? "bg-ok-500" : "bg-ink-200")} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ORDER.map((status) => {
          const isCurrent = status === report.status;
          const isPending = pending === status;
          return (
            <Button
              key={status}
              size="sm"
              variant={isCurrent ? "secondary" : "outline"}
              disabled={isCurrent || pending !== null}
              onClick={() => setStatus(status)}
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Circle className="w-3 h-3" />}
              {statusTokens[status].label}
            </Button>
          );
        })}
      </div>

      {unsupported && (
        <div className="flex items-start gap-2.5 bg-warn-50 border border-warn-100 rounded-xl p-3.5 mt-4">
          <AlertTriangle className="w-4 h-4 text-warn-600 shrink-0 mt-0.5" />
          <p className="text-xs text-warn-800 leading-relaxed">
            The backend doesn't have a status-update endpoint yet. This control calls{" "}
            <code className="font-mono">PATCH /api/v1/reports/&#123;id&#125;/status</code> — once your backend team adds it, this will work immediately.
          </p>
        </div>
      )}
    </Card>
  );
}
