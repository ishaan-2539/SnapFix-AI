import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, ZoomIn, ZoomOut } from "lucide-react";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;transform:translate(-18px,-34px)">
    <svg viewBox="0 0 36 36" width="36" height="36">
      <path d="M18 2C10.8 2 5 7.8 5 15c0 9.5 11.5 18.5 12 18.9a1.4 1.4 0 0 0 2 0C19.5 33.5 31 24.5 31 15 31 7.8 25.2 2 18 2Z" fill="#2563eb" stroke="white" stroke-width="1.5"/>
      <circle cx="18" cy="15" r="5.5" fill="white"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      map.setView([lat, lng], map.getZoom());
      first.current = false;
    }
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-9 h-9 bg-white rounded-lg shadow-elevated flex items-center justify-center text-ink-700 hover:bg-ink-50"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-9 h-9 bg-white rounded-lg shadow-elevated flex items-center justify-center text-ink-700 hover:bg-ink-50"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
    </div>
  );
}

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onLocateMe: () => void;
  locating?: boolean;
}

export function LocationPicker({ lat, lng, onChange, onLocateMe, locating }: LocationPickerProps) {
  const center = useMemo<[number, number]>(() => [lat, lng], [lat, lng]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-ink-200">
      <MapContainer center={center} zoom={16} className="h-full w-full" zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker
          position={center}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker;
              const pos = m.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
        <ClickHandler onChange={onChange} />
        <Recenter lat={lat} lng={lng} />
        <ZoomControls />
      </MapContainer>

      <button
        onClick={onLocateMe}
        disabled={locating}
        className="absolute top-4 right-4 z-[400] w-10 h-10 bg-white rounded-full shadow-elevated flex items-center justify-center text-brand-600 hover:bg-brand-50 disabled:opacity-60"
        aria-label="Use my current location"
      >
        <LocateFixed className={locating ? "w-5 h-5 animate-spin" : "w-5 h-5"} />
      </button>

      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-card text-[11px] font-semibold text-ink-600">
        Drag pin or tap map to adjust
      </div>
    </div>
  );
}
