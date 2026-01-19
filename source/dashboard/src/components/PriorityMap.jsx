import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
  Marker,
} from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { apiClient, listIntersections } from "../utils/apiClient.js";

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#0ea5e9",
  "#d946ef",
];

const DEFAULT_CENTER = [21.0275, 105.8348];
const VEHICLE_TIMEOUT = 30000; // 30 giây

const normalizeMac = (value) => (value || "").trim().toUpperCase();

const resolveSocketUrl = () => {
  // Chỉ dùng VITE_SOCKET_URL nếu được set rõ ràng
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;

  // Nếu localhost, dùng 3000 (server port)
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocal) return "http://localhost:3000";

  // Nếu Docker, dùng cùng origin (dashboard sẽ proxy)
  return window.location.origin;
};

// Component helper để set map ref
function MapRefSetter({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function PriorityMap() {
  const [vehicles, setVehicles] = useState([]);
  const [intersections, setIntersections] = useState([]);
  const [connectionState, setConnectionState] = useState("connecting");
  const [focusedVehicle, setFocusedVehicle] = useState(null);
  const registryRef = useRef({});
  const mapRef = useRef(null);
  const initialFocusDone = useRef(false);

  const bounds = useMemo(() => {
    const coords = vehicles
      .map((v) => v.position)
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    return coords.length ? L.latLngBounds(coords) : null;
  }, [vehicles]);

  const center = useMemo(
    () => (bounds ? bounds.getCenter() : DEFAULT_CENTER),
    [bounds]
  );

  const allPillars = useMemo(
    () =>
      intersections.flatMap(
        (intersection) => intersection.pillars?.map((p) => ({ ...p })) || []
      ),
    [intersections]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const registrations = await apiClient("/vehicle-registrations");
        if (!isMounted || !Array.isArray(registrations)) return;
        console.log("📋 Loaded registrations:", registrations);
        const map = registrations.reduce((acc, item) => {
          const mac = normalizeMac(item.macAddress);
          if (!mac) return acc;
          acc[mac] = {
            ownerName: item.ownerName,
            licensePlate: item.licensePlate,
            vehicleType: item.vehicleType,
            cccd: item.cccd,
          };
          return acc;
        }, {});
        console.log("📋 Registry map:", map);
        registryRef.current = map;
      } catch (err) {
        console.error("Failed to load registrations", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchIntersections = async () => {
      try {
        const { intersections: fetchedIntersections } =
          await listIntersections();
        if (isMounted) {
          setIntersections(fetchedIntersections);
          console.log("Loaded intersections:", fetchedIntersections);
        }
      } catch (err) {
        console.error("Failed to load intersections", err);
      }
    };
    fetchIntersections();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socketUrl = resolveSocketUrl();
    console.log("🔌 Socket connecting to:", socketUrl);
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      setConnectionState("connected");
    });
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setConnectionState("disconnected");
    });
    socket.on("connect_error", (err) => {
      console.error("⚠️  Socket connect_error:", err.message);
      setConnectionState("error");
    });

    socket.on("vehicle-status-update", (payload) => {
      console.log("📍 Received vehicle-status-update:", payload);
      const mac = normalizeMac(payload?.mac || payload?.macAddress);
      const lat = Number(payload?.lat ?? payload?.latitude);
      const lng = Number(payload?.lng ?? payload?.longitude ?? payload?.lon);

      console.log(`  → Parsed: mac=${mac}, lat=${lat}, lng=${lng}`);
      if (!mac) {
        console.warn("  ❌ Invalid mac");
        return;
      }
      if (!Number.isFinite(lat)) {
        console.warn("  ❌ Invalid lat");
        return;
      }
      if (!Number.isFinite(lng)) {
        console.warn("  ❌ Invalid lng");
        return;
      }

      const registry = registryRef.current[mac];
      console.log(`  → Registry found: ${registry ? "yes" : "no"}`, registry);
      const enriched = {
        mac,
        id: registry?.licensePlate || mac,
        owner: registry?.ownerName || registry?.vehicleType || "Chua dang ky",
        vehicleType: registry?.vehicleType,
        licensePlate: registry?.licensePlate,
        position: [lat, lng],
        isWorking: Boolean(payload?.isWorking),
        lastSeen: payload?.timestamp || new Date().toISOString(),
      };
      console.log("  ✅ Adding vehicle:", enriched);

      setVehicles((prev) => {
        const idx = prev.findIndex((v) => v.mac === mac);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...enriched };
          return next;
        }
        return [...prev, enriched];
      });
    });

    const cleanupInterval = setInterval(() => {
      const now = new Date().getTime();
      setVehicles((prevVehicles) => {
        const freshVehicles = prevVehicles.filter((v) => {
          const lastSeenTime = new Date(v.lastSeen).getTime();
          return now - lastSeenTime < VEHICLE_TIMEOUT;
        });

        if (freshVehicles.length < prevVehicles.length) {
          console.log(
            `Cleanup: Removed ${
              prevVehicles.length - freshVehicles.length
            } stale vehicle(s).`
          );
          return freshVehicles;
        }
        return prevVehicles;
      });
    }, 5000); // Chạy kiểm tra mỗi 5 giây

    return () => {
      socket.disconnect();
      clearInterval(cleanupInterval); // Dọn dẹp interval khi component unmount
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !bounds) return;
    mapRef.current.fitBounds(bounds.pad(0.2));
  }, [bounds]);

  // Auto-focus vào xe đầu tiên khi vừa load map
  useEffect(() => {
    if (vehicles.length > 0 && mapRef.current && !initialFocusDone.current) {
      handleFocusVehicle(vehicles[0]);
      setFocusedVehicle(vehicles[0].mac);
      initialFocusDone.current = true;
    }
  }, [vehicles]);

  const handleFocusVehicle = (vehicle) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(vehicle.position, 16, { duration: 0.6 });
    setFocusedVehicle(vehicle.mac);
  };

  const fitAll = () => {
    if (!mapRef.current) return;
    if (bounds) {
      mapRef.current.fitBounds(bounds.pad(0.2));
    } else {
      mapRef.current.setView(DEFAULT_CENTER, 15);
    }
  };

  return (
    <div
      style={{
        marginTop: "2rem",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>Bản đồ xe ưu tiên</h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
          fontSize: 13,
          color: "#475569",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background:
              connectionState === "connected"
                ? "#22c55e"
                : connectionState === "connecting"
                ? "#f59e0b"
                : "#ef4444",
          }}
        />
        <span>Socket: {connectionState}</span>
        <span>|</span>
        <span>{vehicles.length} xe đang hiển thị</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 12 }}>
        <div style={{ minHeight: 400 }}>
          <MapContainer
            center={center}
            zoom={15}
            scrollWheelZoom
            style={{
              width: "100%",
              height: 480,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <MapRefSetter mapRef={mapRef} />
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {allPillars.map((pillar) => (
              <CircleMarker
                key={pillar._id}
                center={[pillar.lat, pillar.lng]}
                radius={7}
                pathOptions={{
                  color: "#f59e0b", // amber
                  fillColor: "#f59e0b",
                  fillOpacity: 0.7,
                }}
              >
                <Tooltip>Trụ đèn: {pillar.description}</Tooltip>
                <Popup>
                  <div style={{ fontSize: 14, fontWeight: "bold" }}>
                    Trụ đèn tín hiệu
                  </div>
                  <div>{pillar.description}</div>
                  <div>
                    Vị trí: {pillar.lat.toFixed(5)}, {pillar.lng.toFixed(5)}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {vehicles.map((vehicle, idx) => {
              const statusColor = vehicle.isWorking ? "#22c55e" : "#ef4444";
              const statusText = vehicle.isWorking
                ? "Đang làm nhiệm vụ"
                : "Chờ lệnh";
              return (
                <CircleMarker
                  key={vehicle.mac}
                  center={vehicle.position}
                  radius={12}
                  pathOptions={{
                    color: statusColor,
                    fillColor: statusColor,
                    fillOpacity: 0.8,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
                    <strong>{vehicle.id}</strong> • {statusText}
                  </Tooltip>
                  <Popup minWidth={240}>
                    <div
                      style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}
                    >
                      {vehicle.licensePlate || vehicle.mac}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      Chủ sở hữu: {vehicle.owner}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      Loại xe: {vehicle.vehicleType || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontFamily: "monospace",
                      }}
                    >
                      MAC: {vehicle.mac}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}
                    >
                      Vị trí: {vehicle.position[0].toFixed(5)},{" "}
                      {vehicle.position[1].toFixed(5)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: vehicle.isWorking ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                        marginTop: 6,
                      }}
                    >
                      {vehicle.isWorking
                        ? "🟢 Đang làm nhiệm vụ"
                        : "🔴 Chờ lệnh"}{" "}
                      • Cập nhật:{" "}
                      {new Date(vehicle.lastSeen).toLocaleTimeString()}
                    </div>
                    <button
                      style={{ marginTop: 8, width: "100%" }}
                      onClick={() => handleFocusVehicle(vehicle)}
                    >
                      Zoom tới vị trí
                    </button>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxHeight: 480,
            overflowY: "auto",
            padding: 8,
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
          }}
        >
          {vehicles.length === 0 && (
            <div style={{ color: "#475569" }}>
              Chưa nhận được gói tin nào từ thiết bị.
            </div>
          )}
          {vehicles.map((vehicle, idx) => {
            const statusColor = vehicle.isWorking ? "#22c55e" : "#ef4444";
            return (
              <div
                key={vehicle.mac}
                onClick={() => handleFocusVehicle(vehicle)}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 10,
                  background:
                    focusedVehicle === vehicle.mac ? "#f0f9ff" : "#fff",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  borderLeft:
                    focusedVehicle === vehicle.mac
                      ? "4px solid #2563eb"
                      : "4px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: statusColor,
                    }}
                  />
                  <strong style={{ flex: 1, fontSize: 14 }}>
                    {vehicle.licensePlate || vehicle.mac}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    fontFamily: "monospace",
                    marginBottom: 4,
                  }}
                >
                  MAC: {vehicle.mac}
                </div>
                <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                  Chủ xe: {vehicle.owner}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Vị trí: {vehicle.position[0].toFixed(4)},{" "}
                  {vehicle.position[1].toFixed(4)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: statusColor,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {vehicle.isWorking ? "🟢 Đang làm nhiệm vụ" : "🔴 Chờ lệnh"}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  Cập nhật: {new Date(vehicle.lastSeen).toLocaleTimeString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFocusVehicle(vehicle);
                  }}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    padding: "6px 12px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Zoom tới vị trí
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
