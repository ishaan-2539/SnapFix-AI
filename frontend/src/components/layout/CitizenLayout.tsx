import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Map, FileText, Camera, ArrowLeft } from "lucide-react";
import { LogoMark, Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/map", label: "Map", icon: Map, end: false },
  { to: "/app/reports", label: "My Reports", icon: FileText, end: false },
];

export function CitizenLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-200 bg-white h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-ink-200">
          <button onClick={() => navigate("/")} aria-label="Back to landing page">
            <Logo />
          </button>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={() => navigate("/app/report")}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Report an Issue
          </button>
        </div>
        <div className="px-6 py-4 border-t border-ink-200">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to site
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ink-200 h-14 flex items-center justify-between px-4">
        <button onClick={() => navigate("/")} aria-label="Back to landing page">
          <LogoMark className="text-brand-600" />
        </button>
        <span className="font-display font-bold text-ink-900">SnapFix AI</span>
        <div className="w-8" />
      </header>

      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-200 grid grid-cols-5 h-[68px] px-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                isActive ? "text-brand-600" : "text-ink-500"
              )
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate("/app/report")}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Report an issue"
        >
          <span className="w-12 h-12 rounded-full bg-brand-600 shadow-floating flex items-center justify-center text-white active:scale-95 transition-transform">
            <Camera className="w-5 h-5" />
          </span>
        </button>
        {navItems.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                isActive ? "text-brand-600" : "text-ink-500"
              )
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        <div />
      </nav>
    </div>
  );
}
