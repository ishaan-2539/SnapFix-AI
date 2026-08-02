import { Link } from "react-router-dom";
import { CheckCircle2, Users2, MapPin, FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SeverityBadge, StatusBadge, PriorityBadge } from "@/components/report/IssueBadges";
import { api } from "@/lib/api";
import type { ReportResponse } from "@/types/api";

export function SuccessStep({ report }: { report: ReportResponse }) {
  const isMerged = report.upvotes > 1;

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          isMerged ? "bg-brand-50" : "bg-ok-50"
        }`}
        style={{ animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {isMerged ? <Users2 className="w-10 h-10 text-brand-600" /> : <CheckCircle2 className="w-10 h-10 text-ok-500" />}
      </div>

      {isMerged ? (
        <>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">This issue already exists nearby</h2>
          <p className="text-ink-500 mt-2 max-w-sm">
            Your report strengthened the existing report. Priority increased and your
            community contribution counts toward it.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">Report submitted!</h2>
          <p className="text-ink-500 mt-2 max-w-sm">
            Thank you — your report is now in the queue and municipal teams can see it.
          </p>
        </>
      )}

      <Card className="w-full max-w-sm mt-7 p-5 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Issue ID</span>
          <span className="font-display font-bold text-ink-900">#{report.id}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-ink-100">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Category</span>
          <span className="font-semibold text-ink-800 text-sm">{report.category}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-ink-100">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Status</span>
          <StatusBadge status={report.status} />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-ink-100">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Severity</span>
          <SeverityBadge score={report.severity_score} />
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Priority</span>
          <PriorityBadge score={report.priority_score} />
        </div>
      </Card>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-6">
        <Link to="/app/map">
          <Button variant="outline" fullWidth>
            <MapPin className="w-4 h-4" />
            View Map
          </Button>
        </Link>
        <Link to={`/app/reports/${report.id}`}>
          <Button variant="outline" fullWidth>
            <FileText className="w-4 h-4" />
            Track Report
          </Button>
        </Link>
      </div>
      <a href={api.pdfUrl(report.id)} target="_blank" rel="noreferrer" className="w-full max-w-sm mt-3">
        <Button fullWidth>
          <FileDown className="w-4 h-4" />
          Download PDF
        </Button>
      </a>

      <style>{`
        @keyframes success-pop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
