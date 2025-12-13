import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Ensure default icons load correctly (Leaflet image paths)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// small colored divIcon generator
const createColoredIcon = (color, size = 26) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size / 2],
  });

const urgencyToColor = (urgency) => {
  const u = (String(urgency || "")).toLowerCase();
  if (u.includes("rouge") || u.includes("ouge")) return "#dc2626";
  if (u.includes("orange") || u.includes("range")) return "#f59e0b";
  return "#10b981";
};

// component to programmatically flyTo a position
function FlyToPosition({ position, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    try {
      map.flyTo(position, zoom, { duration: 0.9 });
    } catch (e) {
      map.setView(position, zoom);
    }
  }, [position, zoom, map]);
  return null;
}

export default function NurseryMap({
  nurseries = [],
  selectedNursery = null,
  onMarkerClick = null,
  height = 480,
}) {
  // filter valid coordinates
  const valid = nurseries
    .filter(
      (n) =>
        n &&
        n.latitude != null &&
        n.longitude != null &&
        !isNaN(Number(n.latitude)) &&
        !isNaN(Number(n.longitude))
    )
    .map((n) => ({
      ...n,
      latitude: Number(n.latitude),
      longitude: Number(n.longitude),
    }));

  // compute center (mean) or fallback to France
  const center = useMemo(() => {
    if (valid.length === 0) return [46.603354, 1.888334];
    const lat = valid.reduce((s, v) => s + v.latitude, 0) / valid.length;
    const lon = valid.reduce((s, v) => s + v.longitude, 0) / valid.length;
    return [lat, lon];
  }, [valid]);

  // position to fly to (selected nursery)
  const selectedPos =
    selectedNursery &&
    selectedNursery.latitude &&
    selectedNursery.longitude
      ? [
          Number(selectedNursery.latitude),
          Number(selectedNursery.longitude),
        ]
      : null;

  const mapRef = useRef(null);

  // Render markers normally (no cluster)
  const markers = valid.map((n, idx) => {
    const color = urgencyToColor(n.urgency);
    const isSelected = selectedNursery && selectedNursery.name === n.name;
    const icon = createColoredIcon(
      isSelected ? "#ffd54d" : color,
      isSelected ? 36 : 26
    );

    return (
      <Marker
        key={idx}
        position={[n.latitude, n.longitude]}
        icon={icon}
        eventHandlers={{
          click: () => onMarkerClick && onMarkerClick(n),
        }}
      >
        <Popup>
          <div style={{ minWidth: 200 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              {n.name}
            </h4>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>📍</strong> {n.location || "—"}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>⚠</strong>{" "}
                <span style={{ color: urgencyToColor(n.urgency) }}>
                  {String(n.urgency || "Verte")}
                </span>
              </div>
              <div style={{ fontWeight: 600, color: "#059669" }}>
                {n.matches || 0} candidat(s)
              </div>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Carte des Crèches</h3>
          <p className="text-sm text-gray-600">
            {valid.length} crèches géolocalisées
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("grandir:reset-map"))
            }
            className="px-3 py-1 border rounded bg-white text-sm"
          >
            Reset view
          </button>
        </div>
      </div>

      <div style={{ height: height, width: "100%" }}>
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {selectedPos && (
            <FlyToPosition position={selectedPos} zoom={15} />
          )}

          {markers}
        </MapContainer>
      </div>
    </div>
  );
}
