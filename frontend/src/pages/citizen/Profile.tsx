import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useMyReports } from "@/hooks/useMyReports";

function initialsFromEmail(email: string | undefined): string {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

function formatMemberSince(dateString: string | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const { myReportIds } = useMyReports();
  const navigate = useNavigate();

  const email = session?.user?.email;
  const memberSince = formatMemberSince(session?.user?.created_at);

  const handleLogOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-6">Profile</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-display font-bold text-lg shrink-0">
            {initialsFromEmail(email)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{email ?? "Signed in"}</p>
            <p className="text-xs text-ink-400">Citizen account</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-ink-100 pt-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-ink-600 truncate">{email ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-ink-600">Member since {memberSince}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FileText className="w-4 h-4 text-ink-400 shrink-0" />
            <span className="text-ink-600">
              {myReportIds.length} report{myReportIds.length === 1 ? "" : "s"} submitted
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleLogOut}
          className="mt-6 text-ink-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </Card>
    </div>
  );
}