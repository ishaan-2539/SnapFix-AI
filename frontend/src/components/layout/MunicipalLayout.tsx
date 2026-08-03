import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, BarChart3, Building2, ArrowLeft, Menu, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/ops", label: "Operations", icon: LayoutDashboard, end: true },
  { to: "/ops/map", label: "City Map", icon: Map, end: false },
  { to: "/ops/analytics", label: "Analytics", icon: BarChart3, end: false },
  { to: "/ops/departments", label: "Departments", icon: Building2, end: false },
];

export function MunicipalLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-950 lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-[1000] h-screen w-72 bg-ink-950 border-r border-white/10 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <button onClick={() => navigate("/")} aria-label="Back to landing page">
            <Logo wordmarkClassName="text-white" />
          </button>
          <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-5 pb-2">
          <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">Municipal Ops</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.75 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "bg-brand-600 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-white/10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit to site
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[900] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 min-w-0 bg-ink-50 lg:rounded-l-[28px] lg:my-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink-200 h-14 flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-ink-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <LogoMark className="text-brand-600 w-6 h-6" />
            <span className="font-display font-bold text-sm text-ink-900">Ops Console</span>
          </div>
          <div className="w-5" />
        </header>
        <Outlet context={{ openMobileMenu: () => setMobileOpen(true) }} />
      </div>
    </div>
  );
}
