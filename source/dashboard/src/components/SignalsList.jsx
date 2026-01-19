import React, { useEffect, useState } from "react";
import { listIntersections } from "../utils/apiClient.js";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

export default function SignalsList({ onBack, onCreateNew }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const fetchAll = async () => {
    setError(null);
    setLoading(true);
    try {
      const { intersections, meta } = await listIntersections();
      setItems(intersections);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Không lấy được danh sách đèn tín hiệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleShowMap = (intersection) => {
    setSelectedIntersection(intersection);
    setShowMapModal(true);
  };

  const getColorByGroupId = (groupId) => {
    const colors = {
      A: "#FF5733",
      B: "#33FF57",
      C: "#3357FF",
      D: "#FF33F5",
      E: "#F5FF33",
      F: "#33FFF5",
    };
    return colors[groupId] || "#999999";
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Danh sách đèn tín hiệu
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button onClick={fetchAll} disabled={loading} variant="contained">
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
        <Button onClick={onCreateNew} variant="contained" color="primary">
          Tạo đèn tín hiệu mới
        </Button>
        {error && (
          <span style={{ color: "crimson", alignSelf: "center" }}>{error}</span>
        )}
        {meta && !error && (
          <span style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
            Tổng: {meta.total}
          </span>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && items.length === 0 && (
        <Typography>Chưa có đèn tín hiệu nào.</Typography>
      )}

      {!loading && items.length > 0 && (
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Tên nút giao thông</th>
                <th style={th}>Địa chỉ MAC</th>
                <th style={th}>Số trụ đèn</th>
                <th style={th}>Tạo lúc</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id}>
                  <td style={td}>{idx + 1}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>
                    <code>{item.mac}</code>
                  </td>
                  <td style={td}>{item.pillars?.length || 0}</td>
                  <td style={td}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td style={td}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleShowMap(item)}
                    >
                      Xem bản đồ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Map Modal */}
      {showMapModal && selectedIntersection && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowMapModal(false)}
        >
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              p: 3,
              maxWidth: "90vw",
              maxHeight: "90vh",
              width: 800,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Bản đồ: {selectedIntersection.name}
              </Typography>
              <Button
                onClick={() => setShowMapModal(false)}
                variant="outlined"
                size="small"
              >
                Đóng
              </Button>
            </Box>

            {/* Chú thích màu */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Chú thích:
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {Array.from(
                  new Set(selectedIntersection.pillars.map((p) => p.groupId))
                ).map((groupId) => (
                  <Box
                    key={groupId}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        backgroundColor: getColorByGroupId(groupId),
                        borderRadius: "50%",
                      }}
                    />
                    <Typography variant="body2">Nhóm {groupId}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Bản đồ */}
            <Box sx={{ height: 500, position: "relative" }}>
              <MapView
                pillars={selectedIntersection.pillars}
                getColorByGroupId={getColorByGroupId}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Component hiển thị bản đồ
function MapView({ pillars, getColorByGroupId }) {
  useEffect(() => {
    // Tính trung tâm bản đồ
    const avgLat = pillars.reduce((sum, p) => sum + p.lat, 0) / pillars.length;
    const avgLng = pillars.reduce((sum, p) => sum + p.lng, 0) / pillars.length;

    // Tạo map
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer) return;

    // Xóa nội dung cũ
    mapContainer.innerHTML = "";

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      // Tạo div cho map
      const mapDiv = document.createElement("div");
      mapDiv.id = "leaflet-map";
      mapDiv.style.width = "100%";
      mapDiv.style.height = "100%";
      mapContainer.appendChild(mapDiv);

      // Khởi tạo map với Leaflet
      const map = window.L.map("leaflet-map").setView([avgLat, avgLng], 17);

      // Thêm tile layer từ OpenStreetMap
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Tạo custom icon cho mỗi marker
      pillars.forEach((p, idx) => {
        const color = getColorByGroupId(p.groupId);

        // Tạo custom marker HTML
        const markerHtml = `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: white;
          ">${idx + 1}</div>
        `;

        const icon = window.L.divIcon({
          html: markerHtml,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        // Thêm marker
        const marker = window.L.marker([p.lat, p.lng], { icon }).addTo(map);

        // Thêm popup
        const popupContent = `
          <div style="font-size: 12px;">
            <strong>${p.description || "Trụ đèn"}</strong><br/>
            Nhóm: ${p.groupId}<br/>
            Chân ESP: ${p.espGroupPin || "N/A"}<br/>
            <small>Vĩ độ: ${p.lat.toFixed(6)}<br/>Kinh độ: ${p.lng.toFixed(
          6
        )}</small>
          </div>
        `;
        marker.bindPopup(popupContent);
      });

      // Điều chỉnh zoom để hiển thị tất cả markers
      const bounds = window.L.latLngBounds(pillars.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });

      // Hiển thị danh sách điểm
      const listDiv = document.createElement("div");
      listDiv.style.position = "absolute";
      listDiv.style.top = "10px";
      listDiv.style.right = "10px";
      listDiv.style.backgroundColor = "white";
      listDiv.style.padding = "10px";
      listDiv.style.borderRadius = "8px";
      listDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      listDiv.style.maxHeight = "300px";
      listDiv.style.overflowY = "auto";
      listDiv.style.zIndex = "1000";
      listDiv.style.fontSize = "12px";

      pillars.forEach((p, idx) => {
        const item = document.createElement("div");
        item.style.marginBottom = "8px";
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "8px";
        item.style.cursor = "pointer";

        const marker = document.createElement("div");
        marker.style.width = "20px";
        marker.style.height = "20px";
        marker.style.borderRadius = "50%";
        marker.style.backgroundColor = getColorByGroupId(p.groupId);
        marker.style.flexShrink = "0";
        marker.style.display = "flex";
        marker.style.alignItems = "center";
        marker.style.justifyContent = "center";
        marker.style.color = "white";
        marker.style.fontWeight = "bold";
        marker.style.fontSize = "10px";
        marker.textContent = idx + 1;

        const text = document.createElement("div");
        text.innerHTML = `<strong>${
          p.description || "Trụ đèn"
        }</strong> (Nhóm ${p.groupId})<br/><small>${p.lat.toFixed(
          6
        )}, ${p.lng.toFixed(6)}</small>`;

        item.appendChild(marker);
        item.appendChild(text);

        // Click để center map vào marker này
        item.onclick = () => {
          map.setView([p.lat, p.lng], 18);
        };

        listDiv.appendChild(item);
      });

      mapContainer.appendChild(listDiv);
    });
  }, [pillars, getColorByGroupId]);

  return <div id="map-container" style={{ width: "100%", height: "100%" }} />;
}

const th = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#f2f2f2",
};

const td = {
  border: "1px solid #ddd",
  padding: "8px",
};
