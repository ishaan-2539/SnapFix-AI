import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Camera, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Explore Map", href: "/map" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-[1000] bg-white border-b border-ink-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" aria-label="SnapFix AI home">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) =>
              l.href.startsWith("#") ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.href}
                  className="text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>

           <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-brand-700 border border-ink-200 hover:border-brand-200 hover:bg-brand-50 rounded-full pl-2.5 pr-3 py-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Sign in
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
              Get Started
            </Button>
            <Button size="sm" onClick={() => navigate("/app/report")}>
              <Camera className="w-4 h-4" />
              Report an Issue
            </Button>
          </div>

          <button
            className="lg:hidden p-2 text-ink-700"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-[1001] border-t border-ink-200 bg-white px-4 py-4 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-elevated">
          {links.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-ink-700 font-medium hover:bg-ink-50"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-ink-700 font-medium hover:bg-ink-50"
              >
                {l.label}
              </Link>
            )
          )}
          <div className="flex flex-col gap-2 mt-3">
            <Button variant="outline" onClick={() => navigate("/app")}>
              Get Started
            </Button>
            <Button onClick={() => navigate("/app/report")}>
              <Camera className="w-4 h-4" />
              Report an Issue
            </Button>
            <button
              onClick={() => { setOpen(false); navigate("/login"); }}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink-500 border border-ink-200 rounded-full py-2 mt-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Sign in
            </button>
          </div>
        </div>
      )}
    </>
  );
}