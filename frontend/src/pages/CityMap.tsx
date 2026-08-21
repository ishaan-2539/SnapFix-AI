import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Search, LocateFixed, Camera, ArrowLeft, ListFilter, Menu } from "lucide-react";
import { MapSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkerCard } from "@/components/map/MarkerCard";
import { api, extractErrorMessage } from "@/lib/api";
import { statusMarkerIcon, createClusterIcon } from "@/lib/mapIcons";
import { categoryIcon } from "@/lib/utils";
import { LogoMark } from "@/components/ui/Logo";
import type { MapPin } from "@/types/api";

const CATEGORIES = [
  "Pothole",
  "Trash/Garbage",
  "Water Leak",
  "Damaged Streetlight",
  "Road Damage",
  "Broken Sidewalk",
  "Other",
];

// BUGFIX: the AI backend (ai_service.py's Gemini prompt) labels this
// category "Trash / Garbage" (spaces around the slash), but this file's
// CATEGORIES list and filter chips use "Trash/Garbage" (no spaces). Every
// report saved by the API ends up with the spaced version, so an exact
// string match against the chip's label silently matched zero pins whenever
// that filter was active. Normalizing both sides before comparing fixes
// existing data too, without needing a backend redeploy or DB migration.
const normalizeCategory = (cat: string) =>
  cat.trim().toLowerCase().replace(/\s*\/\s*/g, "/");

const DEFAULT_CENTER: [number, number] = [28.6469, 77.391];

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.1 });
  }, [lat, lng, map]);
  return null;
}

interface CityMapProps {
  /** When true, shows the standalone public-site chrome (back link, no app nav). */
  standalone?: boolean;
  reportPath?: string;
  detailsBasePath?: string;
  /** When provided (embedded in a layout with a sidebar, e.g. Ops), shows a menu button that calls this. */
  onMenuClick?: () => void;
}

export default function CityMap({ standalone = false, reportPath = "/app/report", detailsBasePath = "/app/reports", onMenuClick }: CityMapProps) {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [selected, setSelected] = useState<MapPin | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    api
      .getMapPins()
      .then(setPins)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      const matchesQuery =
        query.trim() === "" ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.summary.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        activeCategories.size === 0 ||
        activeCategories.has(p.category) || // fast path for already-consistent data
        Array.from(activeCategories).some(
          (cat) => normalizeCategory(cat) === normalizeCategory(p.category)
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "resolved" ? p.status === "RESOLVED" : p.status !== "RESOLVED");
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [pins, query, activeCategories, statusFilter]);

  // BUGFIX: the detail card for `selected` rendered independent of the
  // `filtered` list, so toggling a filter that excluded the currently-open
  // pin left its card floating on screen while the map showed "No Search
  // Results" underneath — confusing since the two contradicted each other.
  useEffect(() => {
    if (selected && !filtered.some((p) => p.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFlyTarget({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="relative h-[calc(100dvh-56px)] lg:h-full w-full overflow-hidden bg-ink-100">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-[500] p-3 sm:p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          {standalone && (
            <Link
              to="/"
              className="w-10 h-10 shrink-0 bg-white rounded-full shadow-elevated flex items-center justify-center text-ink-700"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
          )}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="w-10 h-10 shrink-0 bg-white rounded-full shadow-elevated flex items-center justify-center text-ink-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          )}
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full shadow-elevated px-4 h-11">
            <Search className="w-4 h-4 text-ink-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues, categories…"
              className="flex-1 outline-none text-sm text-ink-800 placeholder:text-ink-400 bg-transparent"
              aria-label="Search issues"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="w-10 h-10 shrink-0 bg-white rounded-full shadow-elevated flex items-center justify-center text-ink-700 relative"
            aria-label="Filter categories"
          >
            <ListFilter className="w-4.5 h-4.5" />
            {(activeCategories.size > 0 || statusFilter !== "all") && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeCategories.size + (statusFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 bg-white rounded-full shadow-card p-1 w-fit">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "resolved", label: "Resolved" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    statusFilter === opt.key ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcon(cat);
                const active = activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.75 rounded-full text-xs font-semibold border shadow-card transition-colors ${
                      active ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-ink-200 text-ink-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {loading ? (
        <MapSkeleton />
      ) : error ? (
        <div className="h-full flex items-center justify-center">
          <EmptyState icon={LogoMark as any} title="Couldn't load the map" description={error} />
        </div>
      ) : (
        <MapContainer center={DEFAULT_CENTER} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
          <MarkerClusterGroup chunkedLoading maxClusterRadius={50} iconCreateFunction={createClusterIcon}>
            {filtered.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                icon={statusMarkerIcon(pin, selected?.id === pin.id)}
                eventHandlers={{ click: () => setSelected(pin) }}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}

      {/* Empty filtered state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none px-6">
          <div className="pointer-events-auto">
            <EmptyState
              icon={Search}
              title="No Search Results"
              description="Try a different search term, or clear your category and status filters."
            />
          </div>
        </div>
      )}

      {/* GPS button */}
      <button
        onClick={locateMe}
        className="absolute bottom-24 sm:bottom-6 right-4 z-[500] w-11 h-11 bg-white rounded-full shadow-floating flex items-center justify-center text-brand-600"
        aria-label="Use my location"
      >
        <LocateFixed className="w-5 h-5" />
      </button>

      {/* Floating report button */}
      <Link
        to={reportPath}
        className="absolute bottom-24 sm:bottom-6 left-4 z-[500] flex items-center gap-2 bg-brand-600 text-white font-semibold text-sm px-4 h-11 rounded-full shadow-floating hover:bg-brand-700"
      >
        <Camera className="w-4 h-4" />
        Report Issue
      </Link>

      {/* Marker detail — bottom sheet (mobile) / side panel (desktop) */}
      {selected && (
        <>
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-[600]">
            <MarkerCard pin={selected} onClose={() => setSelected(null)} detailsBasePath={detailsBasePath} />
          </div>
          <div className="hidden sm:block absolute top-20 right-4 z-[600] w-80">
            <MarkerCard pin={selected} onClose={() => setSelected(null)} detailsBasePath={detailsBasePath} />
          </div>
        </>
      )}
    </div>
  );
}
