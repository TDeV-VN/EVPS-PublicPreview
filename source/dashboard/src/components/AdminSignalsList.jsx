import React, { useEffect, useState } from "react";
import {
  listIntersections,
  deleteIntersection,
  triggerFirmwareUpdate,
  getFirmwares,
  apiClient,
} from "../utils/apiClient.js";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import HelpIcon from "@mui/icons-material/Help";

export default function AdminSignalsList({ onBack, onCreateNew }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  // Selection & Update states
  const [selectedIds, setSelectedIds] = useState([]);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [updateScope, setUpdateScope] = useState(""); // 'all', 'selected', 'single'
  const [updateTargetSingle, setUpdateTargetSingle] = useState(null);
  const [latestFirmware, setLatestFirmware] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      await apiClient("/firmware/sync", {
        method: "POST",
        body: { type: "receiver" },
      });
      await fetchAll(); // Refresh to get latest firmware info
      setMessage("Đồng bộ firmware thành công!");
    } catch (err) {
      console.error(err);
      setMessage("Lỗi đồng bộ: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const fetchAll = async () => {
    setError(null);
    setLoading(true);
    try {
      const [{ intersections, meta }, firmwaresRes] = await Promise.all([
        listIntersections(),
        getFirmwares(),
      ]);
      setItems(intersections);
      setMeta(meta);

      // Handle firmware response (could be array or { data: [] })
      const firmwareList = Array.isArray(firmwaresRes)
        ? firmwaresRes
        : firmwaresRes?.data && Array.isArray(firmwaresRes.data)
        ? firmwaresRes.data
        : [];

      // Find latest receiver firmware
      const receivers = firmwareList.filter((f) => f.type === "receiver");

      // Sort by createdAt desc
      receivers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (receivers.length > 0) {
        setLatestFirmware(receivers[0]);
      }
    } catch (err) {
      setError(err.message || "Không lấy được danh sách đèn tín hiệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(items.map((i) => i.mac).filter((m) => m));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (event, mac) => {
    if (event.target.checked) {
      setSelectedIds((prev) => [...prev, mac]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== mac));
    }
  };

  const initUpdate = (scope, targetItem = null) => {
    if (scope === "selected" && selectedIds.length === 0) return;
    setUpdateScope(scope);
    setUpdateTargetSingle(targetItem);
    setShowUpdateConfirm(true);
  };

  const performUpdate = async () => {
    setShowUpdateConfirm(false);
    setMessage(null);
    const payload = { type: "", targets: [] };

    if (updateScope === "all") {
      payload.type = "all";
    } else if (updateScope === "selected") {
      payload.type = "list";
      payload.targets = selectedIds;
    } else if (updateScope === "single") {
      payload.type = "list";
      // Ensure targetItem has mac
      if (!updateTargetSingle?.mac) {
        setMessage("Lỗi: Thiết bị không có MAC");
        return;
      }
      payload.targets = [updateTargetSingle.mac];
    }

    try {
      const res = await triggerFirmwareUpdate(payload);
      setMessage(`Thành công: ${res.message || "Đã gửi lệnh cập nhật"}`);
      // Clear selection after success if it was 'selected' update? Maybe keep it.
    } catch (err) {
      console.error(err);
      setMessage(`Lỗi: ${err.message}`);
    }
  };

  const handleShowMap = (intersection) => {
    setSelectedIntersection(intersection);
    setShowMapModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa đèn tín hiệu này?")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      await deleteIntersection(id);
      setMessage("Đã xóa đèn tín hiệu");
      await fetchAll();
    } catch (err) {
      setMessage(err.message || "Xóa thất bại");
    } finally {
      setActionLoading(null);
    }
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

  // Helper: Normalize version string for comparison (e.g. "v0.1.1-receiver" == "0.1.1")
  const isVersionMatch = (serverVer, deviceVer) => {
    if (!serverVer || !deviceVer) return false;

    // Debug log to console
    // console.log("Comparing:", serverVer, deviceVer);

    // Remove "v" prefix, remove "-receiver/-transmitter" suffix
    const cleanServer = serverVer.replace(/^v/, "").split("-")[0];
    const cleanDevice = deviceVer.replace(/^v/, "").split("-")[0];

    return cleanServer === cleanDevice;
  };

  const allSynced =
    items.length > 0 &&
    latestFirmware &&
    items.every((item) =>
      isVersionMatch(latestFirmware.version, item.currentVersion)
    );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Quản lý đèn tín hiệu
      </Typography>

      <Box
        sx={{
          mb: 2,
          p: 2,
          bgcolor: "#e3f2fd",
          borderRadius: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Phiên bản Firmware (Receiver):{" "}
            {latestFirmware ? latestFirmware.version : "Chưa có dữ liệu"}
          </Typography>
          {latestFirmware && (
            <Typography variant="body2" color="textSecondary">
              Cập nhật lúc:{" "}
              {new Date(
                latestFirmware.updatedAt || latestFirmware.createdAt
              ).toLocaleString("vi-VN")}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleSync}
          disabled={syncing}
          startIcon={
            syncing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudDownloadIcon />
            )
          }
        >
          {syncing ? "Đang tải..." : "Tải bản mới từ GitHub"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
        <Button onClick={fetchAll} disabled={loading} variant="contained">
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
        <Button onClick={onCreateNew} variant="contained" color="primary">
          Tạo đèn tín hiệu mới
        </Button>
        {!allSynced && (
          <Button
            variant="contained"
            color="warning"
            onClick={() => initUpdate("all")}
            disabled={loading || items.length === 0}
          >
            Cập nhật tất cả
          </Button>
        )}
        <Button
          variant="outlined"
          color="warning"
          onClick={() => initUpdate("selected")}
          disabled={loading || selectedIds.length === 0}
        >
          Cập nhật đã chọn ({selectedIds.length})
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

      {message && (
        <Alert
          severity={message.includes("thành công") ? "success" : "error"}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

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
                <th style={th}>
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < items.length
                    }
                    checked={
                      items.length > 0 && selectedIds.length === items.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={th}>#</th>
                <th style={th}>Tên nút giao thông</th>
                <th style={th}>Địa chỉ MAC</th>
                <th style={th}>Phiên bản</th>
                <th style={th}>Số trụ đèn</th>
                <th style={th}>Tạo lúc</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id}>
                  <td style={td}>
                    <Checkbox
                      color="primary"
                      checked={selectedIds.includes(item.mac)}
                      onChange={(e) => handleSelectOne(e, item.mac)}
                    />
                  </td>
                  <td style={td}>{idx + 1}</td>
                  <td style={td}>{item.name}</td>
                  <td style={td}>
                    <code>{item.mac}</code>
                  </td>
                  <td style={td}>
                    {item.currentVersion ? (
                      latestFirmware &&
                      isVersionMatch(
                        latestFirmware.version,
                        item.currentVersion
                      ) ? (
                        <Tooltip
                          title={`Đã đồng bộ (Server: ${latestFirmware.version})`}
                        >
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={item.currentVersion}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title={`Chưa đồng bộ! Server đang là: ${
                            latestFirmware?.version || "N/A"
                          } (Click để cập nhật)`}
                        >
                          <Chip
                            icon={<WarningIcon />}
                            label={item.currentVersion}
                            color="error"
                            size="small"
                            onClick={() => initUpdate("single", item)}
                            sx={{ cursor: "pointer" }}
                          />
                        </Tooltip>
                      )
                    ) : (
                      <Chip
                        icon={<HelpIcon />}
                        label="Chưa rõ"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </td>
                  <td style={td}>{item.pillars?.length || 0}</td>
                  <td style={td}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td style={td}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleShowMap(item)}
                      >
                        Xem bản đồ
                      </Button>

                      {/* Hide Update button if already synced */}
                      {(!latestFirmware ||
                        !item.currentVersion ||
                        !isVersionMatch(
                          latestFirmware.version,
                          item.currentVersion
                        )) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() => initUpdate("single", item)}
                        >
                          Cập nhật
                        </Button>
                      )}

                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(item._id)}
                        disabled={actionLoading === item._id}
                      >
                        {actionLoading === item._id ? "..." : "Xóa"}
                      </Button>
                    </Box>
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

      {/* Update Confirm Modal */}
      <Dialog
        open={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
      >
        <DialogTitle>Xác nhận cập nhật Firmware</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {updateScope === "all" &&
              "Bạn có chắc chắn muốn gửi lệnh cập nhật cho TẤT CẢ đèn tín hiệu?"}
            {updateScope === "selected" &&
              `Bạn có chắc chắn muốn cập nhật cho ${selectedIds.length} đèn tín hiệu đã chọn?`}
            {updateScope === "single" &&
              `Cập nhật Firmware cho: ${updateTargetSingle?.name} (${updateTargetSingle?.mac})?`}
            <br />
            <br />
            Lưu ý: Thiết bị sẽ chuyển sang chế độ an toàn (Đèn đỏ) trong quá
            trình cập nhật.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateConfirm(false)}>Hủy</Button>
          <Button
            onClick={performUpdate}
            autoFocus
            variant="contained"
            color="warning"
          >
            Tiến hành Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
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
      mapDiv.id = "leaflet-map-admin";
      mapDiv.style.width = "100%";
      mapDiv.style.height = "100%";
      mapContainer.appendChild(mapDiv);

      // Khởi tạo map với Leaflet
      const map = window.L.map("leaflet-map-admin").setView(
        [avgLat, avgLng],
        17
      );

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
