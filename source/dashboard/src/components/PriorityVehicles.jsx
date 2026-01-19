import React, { useEffect, useState } from "react";
import { apiClient } from "../utils/apiClient.js";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

export default function PriorityVehicles({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [latestFirmware, setLatestFirmware] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadLatestFirmware = async () => {
    try {
      const data = await apiClient("/firmware/latest/transmitter");
      setLatestFirmware(data);
    } catch (err) {
      console.warn("Could not fetch latest transmitter firmware:", err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient("/firmware/sync", {
        method: "POST",
        body: { type: "transmitter" },
      });
      await loadLatestFirmware();
      alert("Đồng bộ thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi đồng bộ: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ isApproved: "true" });
      if (searchKeyword.trim()) {
        params.append("keyword", searchKeyword.trim());
      }
      const data = await apiClient(`/vehicle-registrations?${params}`);
      setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
      setError("Không thể tải danh sách phương tiện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadLatestFirmware();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadVehicles();
  };

  // Helper: Normalize version string for comparison (e.g. "v0.1.1-transmitter" == "0.1.1")
  const isVersionMatch = (serverVer, deviceVer) => {
    if (!serverVer || !deviceVer) return false;
    // Remove "v" prefix, remove "-receiver/-transmitter" suffix
    const cleanServer = serverVer.replace(/^v/, "").split("-")[0];
    const cleanDevice = deviceVer.replace(/^v/, "").split("-")[0];
    return cleanServer === cleanDevice;
  };

  const handleRevoke = async (id) => {
    if (!confirm("Xác nhận thu hồi phê duyệt phương tiện này?")) return;
    try {
      await apiClient(`/vehicle-registrations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isApproved: false }),
      });
      alert("Đã thu hồi phê duyệt!");
      loadVehicles();
    } catch (err) {
      console.error("Failed to revoke:", err);
      alert("Không thể thu hồi: " + (err.message || "Lỗi không xác định"));
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Danh sách phương tiện ưu tiên</Typography>
        <Button onClick={onBack} variant="outlined">
          Quay lại
        </Button>
      </Box>

      <Box
        sx={{
          mb: 2,
          p: 2,
          bgcolor: "#e3f2fd",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Phiên bản Firmware mới nhất (Transmitter):{" "}
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

      <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
        <TextField
          label="Tìm kiếm (Tên, Biển số, SĐT...)"
          variant="outlined"
          size="small"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          sx={{ mr: 1, minWidth: 300 }}
        />
        <Button type="submit" variant="contained">
          Tìm
        </Button>
      </form>

      {error && <Typography color="error">{error}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Chủ sở hữu</TableCell>
              <TableCell>Biển số</TableCell>
              <TableCell>Loại xe</TableCell>
              <TableCell>SĐT</TableCell>
              <TableCell>Phiên bản</TableCell>
              <TableCell>Ngày cấp phép</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không tìm thấy dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v._id}>
                  <TableCell>{v.ownerName}</TableCell>
                  <TableCell>{v.licensePlate}</TableCell>
                  <TableCell>{v.vehicleType}</TableCell>
                  <TableCell>{v.phoneNumber}</TableCell>
                  <TableCell>
                    {v.currentVersion ? (
                      latestFirmware &&
                      isVersionMatch(
                        latestFirmware.version,
                        v.currentVersion
                      ) ? (
                        <Tooltip
                          title={`Đã đồng bộ (Server: ${latestFirmware.version})`}
                        >
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={v.currentVersion}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title={`Chưa đồng bộ! Server đang là: ${
                            latestFirmware?.version || "N/A"
                          }`}
                        >
                          <Chip
                            label={v.currentVersion}
                            color="warning"
                            size="small"
                          />
                        </Tooltip>
                      )
                    ) : (
                      <Chip label="Chưa rõ" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {v.approvedAt
                      ? new Date(v.approvedAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRevoke(v._id)}
                    >
                      Thu hồi
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
