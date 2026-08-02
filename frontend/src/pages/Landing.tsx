import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  BrainCircuit,
  BarChart3,
  LayoutDashboard,
  FileDown,
  ArrowRight,
  ScanLine,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoMark } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { statusMarkerIcon } from "@/lib/mapIcons";
import type { AnalyticsStats, MapPin as MapPinType } from "@/types/api";

function useCountUp(target: number, duration = 1400, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function StatCounter({
  label,
  value,
  suffix = "",
  start,
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  start: boolean;
  decimals?: number;
}) {
  const n = useCountUp(value, 1400, start);
  const formatted =
    decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString("en-IN");
  return (
    <div className="text-center">
      <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
        {formatted}
        {suffix}
      </p>
      <p className="text-white/60 text-xs sm:text-sm font-medium mt-1">{label}</p>
    </div>
  );
}

const steps = [
  {
    icon: Camera,
    title: "Snap",
    body: "Photograph the pothole, leak, or broken light exactly where it stands. Your camera captures GPS location automatically.",
  },
  {
    icon: BrainCircuit,
    title: "Analyze",
    body: "AI vision reads the photo in seconds — identifying the category, estimating severity, and writing a clear summary.",
  },
  {
    icon: Wrench,
    title: "Resolve",
    body: "Your report reaches the right municipal department with a ready-to-act work order, and you can track it end to end.",
  },
];

const features = [
  {
    icon: ScanLine,
    title: "AI Analysis",
    body: "Every photo is automatically categorized and scored for severity — no forms to fill, no dropdowns to hunt through.",
  },
  {
    icon: MapPin,
    title: "Interactive Maps",
    body: "See every open issue in your city, color-coded by urgency, updating as new reports come in.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    body: "Track resolution rates and issue trends across categories, so progress is visible — not just promised.",
  },
  {
    icon: LayoutDashboard,
    title: "Municipal Dashboard",
    body: "Departments see a live, prioritized queue instead of a pile of unsorted complaints.",
  },
  {
    icon: FileDown,
    title: "PDF Work Orders",
    body: "Every valid report generates a field-ready work order — photo, location, and severity, printable in one click.",
  },
  {
    icon: CheckCircle2,
    title: "Duplicate Merging",
    body: "Report something already flagged nearby? SnapFix merges it in and boosts its priority instead of cluttering the queue.",
  },
];

export default function Landing() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [pins, setPins] = useState<MapPinType[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setStats(null));
    api.getMapPins().then(setPins).catch(() => setPins([]));
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const departmentCount = stats ? Object.keys(stats.category_breakdown).length : 0;

  return (
    <div className="bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white border border-ink-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-600 shadow-card">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500" />
                Live across Delhi NCR pilot wards
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-ink-900 leading-[1.08] mt-5">
                Making Indian Cities Better, Together.
              </h1>
              <p className="text-ink-600 text-lg mt-5 max-w-lg leading-relaxed">
                SnapFix AI helps citizens report civic infrastructure issues using
                AI-powered image analysis so municipalities can respond faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link to="/app/report">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Camera className="w-5 h-5" />
                    Report an Issue
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <MapPin className="w-5 h-5" />
                    Explore City Map
                  </Button>
                </Link>
              </div>
            </div>

            {/* Floating dashboard preview */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 bg-brand-200/30 blur-3xl rounded-full" />
              <Card className="relative p-5 shadow-floating rotate-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-ink-400 uppercase tracking-wide">City Health</span>
                  <span className="text-xs font-semibold text-ok-600 bg-ok-50 px-2 py-1 rounded-full">Improving</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Open", value: stats?.open_reports ?? "—", tone: "text-danger-600" },
                    { label: "Resolved", value: stats?.resolved_reports ?? "—", tone: "text-ok-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-ink-50 rounded-xl p-3">
                      <p className={`font-display font-extrabold text-2xl ${s.tone}`}>{s.value}</p>
                      <p className="text-xs text-ink-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {["Pothole · Sector 12", "Water Leak · MG Road", "Streetlight · Vaishali"].map((item, i) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: i === 0 ? "#dc2626" : i === 1 ? "#d97706" : "#16a34a" }}
                      />
                      <span className="text-ink-700 font-medium truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="absolute -bottom-8 -left-10 px-4 py-3 shadow-floating -rotate-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center">
                    <LogoMark className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900">Report submitted</p>
                    <p className="text-[11px] text-ink-500">Analyzed in 3.2s</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section ref={statsRef} className="bg-ink-950 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-3 gap-8">
          <StatCounter label="Issues Reported" value={stats?.total_reports ?? 0} start={statsVisible} />
          <StatCounter label="Issues Resolved" value={stats?.resolved_reports ?? 0} start={statsVisible} />
          <StatCounter label="Departments Engaged" value={departmentCount} start={statsVisible} />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-brand-600 font-bold text-sm tracking-wide uppercase">How it works</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3">
            Three steps. That's the whole flow.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <Card className="p-7 h-full">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center mb-5">
                  <step.icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900">{step.title}</h3>
                <p className="text-ink-500 text-sm mt-2 leading-relaxed">{step.body}</p>
              </Card>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-6 text-ink-300 z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-ink-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-brand-600 font-bold text-sm tracking-wide uppercase">Features</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3">
              Built for reliability, not novelty.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="p-6 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200">
                <f.icon className="w-6 h-6 text-brand-600 mb-4" strokeWidth={2} />
                <h3 className="font-semibold text-ink-900">{f.title}</h3>
                <p className="text-ink-500 text-sm mt-2 leading-relaxed">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-brand-600 font-bold text-sm tracking-wide uppercase">City Map</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-900 mt-3">
              Every report, right where it happened.
            </h2>
            <p className="text-ink-500 mt-4 leading-relaxed max-w-md">
              Colour-coded by severity, clustered by neighbourhood — see what's
              nearby before you even open a report.
            </p>
            <Link to="/map">
              <Button variant="outline" className="mt-6">
                Explore the full map
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <Link to="/map" className="block">
            <Card className="relative h-72 overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 pointer-events-none">
                <MapContainer
                  center={
                    pins.length > 0
                      ? [
                          pins.reduce((sum, p) => sum + p.latitude, 0) / pins.length,
                          pins.reduce((sum, p) => sum + p.longitude, 0) / pins.length,
                        ]
                      : [28.6469, 77.391]
                  }
                  zoom={12}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  boxZoom={false}
                  keyboard={false}
                  attributionControl={false}
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {pins.slice(0, 20).map((p) => (
                    <Marker key={p.id} position={[p.latitude, p.longitude]} icon={statusMarkerIcon(p)} />
                  ))}
                </MapContainer>
              </div>
              <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors pointer-events-none" />
              <div className="absolute bottom-4 left-4 bg-white rounded-xl px-3.5 py-2 shadow-elevated text-xs font-semibold text-ink-700 flex items-center gap-2 pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                {pins.length} active reports nearby
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-600 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            See something broken? Snap it.
          </h2>
          <p className="text-brand-100 mt-3 max-w-md mx-auto">
            It takes under a minute, and your report could be the one that gets it fixed.
          </p>
          <Link to="/app/report">
            <Button size="lg" className="mt-7 bg-white text-brand-700 hover:bg-brand-50">
              <Camera className="w-5 h-5" />
              Report an Issue
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-950 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <LogoMark className="text-white w-7 h-7" />
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} SnapFix AI. Built for Indian municipalities.</p>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/map" className="hover:text-white transition-colors">Map</Link>
            <Link to="/ops" className="hover:text-white transition-colors">Municipal Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
