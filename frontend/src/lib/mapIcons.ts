import L from "leaflet";
import { severityHex } from "@/lib/utils";

const cache = new Map<string, L.DivIcon>();

const CHECK_SVG =
  '<path d="M4 8.5 6.8 11 12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';

export function severityMarkerIcon(score: number, selected = false): L.DivIcon {
  const key = `sev-${score}-${selected}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const color = severityHex(score);
  const size = selected ? 40 : 30;
  const icon = L.divIcon({
    className: "",
    html: `<div class="snap-marker" style="width:${size}px;height:${size}px;background:${color};font-size:${
      selected ? 13 : 11
    }px;">${score}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  cache.set(key, icon);
  return icon;
}

/**
 * Status-aware marker: resolved issues render as a muted grey check instead
 * of a severity number, so a fixed pothole doesn't still look "urgent" on the
 * map. Active issues fall back to the usual severity coloring.
 */
export function statusMarkerIcon(pin: { status: string; severity_score: number }, selected = false): L.DivIcon {
  if (pin.status === "RESOLVED") {
    const key = `resolved-${selected}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const size = selected ? 34 : 24;
    const icon = L.divIcon({
      className: "",
      html: `<div class="snap-marker" style="width:${size}px;height:${size}px;background:#94a3b8;opacity:0.85;">
        <svg viewBox="0 0 16 16" width="${size * 0.55}" height="${size * 0.55}">${CHECK_SVG}</svg>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    cache.set(key, icon);
    return icon;
  }
  return severityMarkerIcon(pin.severity_score, selected);
}

/**
 * Branded cluster icon — a solid brand-blue badge with a white count, sized
 * in three tiers by how many reports it groups. Used via MarkerClusterGroup's
 * `iconCreateFunction` so overlapping pins at low zoom read as one clear,
 * on-brand number instead of the library's default unstyled/low-contrast dot.
 */
export function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 38 : count < 25 ? 46 : 54;
  const fontSize = count < 10 ? 14 : count < 25 ? 15 : 16;

  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        background:#2563eb;
        border:3px solid white;
        border-radius:9999px;
        box-shadow:0 4px 12px -2px rgba(15,23,42,0.25), 0 2px 6px -2px rgba(15,23,42,0.15);
        color:white;font-weight:800;font-size:${fontSize}px;
        font-family:'Inter',ui-sans-serif,system-ui,sans-serif;
      ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
