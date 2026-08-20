import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/ui/Logo";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    // Auth succeeded — but that alone doesn't mean this account belongs here.
    // Check the role before ever navigating, so a valid-but-wrong-role login
    // shows a real error instead of bouncing silently through RequireRole.
    const { data } = await supabase.auth.getSession();
    const role = data.session?.user?.app_metadata?.role;
    setLoading(false);

    if (role !== "municipal_staff") {
      await supabase.auth.signOut();
      setError("This account doesn't have municipal access.");
      return;
    }

    navigate("/ops", { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </button>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <LogoMark className="text-brand-500 w-7 h-7" />
          <span className="font-display font-bold text-lg text-white">SnapFix AI</span>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
              Municipal access
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-white mb-6">
            Sign in to the ops console
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500"
                placeholder="you@department.gov"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Reporting an issue? You don't need an account —{" "}
          <a href="/app/report" className="text-white/50 hover:text-white/80 underline">
            report it directly
          </a>
          .
        </p>
      </div>
    </div>
  );
}