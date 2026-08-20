import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/ui/Logo";
import { ShieldCheck, User, ArrowLeft } from "lucide-react";

type Mode = "citizen" | "municipal";

export default function Login() {
  const [mode, setMode] = useState<Mode>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
  };

  // Citizen sign-in — any account is welcome here; unlike the municipal
  // flow below, there's no role check, since /app never gates on role.
  const handleCitizenSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError("Invalid email or password.");
      return;
    }

    navigate("/app", { replace: true });
  };

  // Citizen sign-up — creates a brand-new Supabase account with no
  // app_metadata.role set, so useAuth() defaults it to "citizen".
  const handleCitizenSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Depending on your Supabase project's email confirmation setting,
    // a fresh sign-up either returns a live session immediately, or
    // requires the user to click a confirmation link first.
    if (data.session) {
      navigate("/app", { replace: true });
    } else {
      setInfo("Account created. Check your email to confirm it, then sign in.");
    }
  };

  // Municipal sign-in — unchanged from before: still verifies the
  // app_metadata.role claim and signs the user back out if it doesn't
  // match, so a valid-but-wrong-role login shows a real error instead
  // of silently bouncing through RequireRole.
  const handleMunicipalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

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
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("citizen")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md py-2 transition-colors ${
                mode === "citizen" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Citizen
            </button>
            <button
              type="button"
              onClick={() => switchMode("municipal")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-md py-2 transition-colors ${
                mode === "municipal" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Municipal staff
            </button>
          </div>

          {mode === "citizen" ? (
            <>
              <h1 className="font-display text-xl font-bold text-white mb-1">
                Sign in to track your reports
              </h1>
              <p className="text-xs text-white/40 mb-6">
                Save your reports to your account instead of just this device.
              </p>

              <form onSubmit={handleCitizenSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-500"
                    placeholder="you@example.com"
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
                {info && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    {info}
                  </p>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-10 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCitizenSignUp}
                    disabled={loading}
                    className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    Create account
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
                  Municipal access
                </span>
              </div>
              <h1 className="font-display text-xl font-bold text-white mb-6">
                Sign in to the ops console
              </h1>

              <form onSubmit={handleMunicipalSignIn} className="space-y-4">
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
            </>
          )}
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