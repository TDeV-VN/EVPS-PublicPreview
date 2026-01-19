import React, { useEffect, useState } from "react";
import { apiClient } from "../utils/apiClient.js";

export default function NewRegistrations({ onBack }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient("/vehicle-registrations?isApproved=false");
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to load registrations:", err);
      setError("Không thể tải danh sách đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm("Xác nhận phê duyệt đăng ký này?")) return;
    try {
      setApproving(id);
      await apiClient(`/vehicle-registrations/${id}/approve`, {
        method: "PATCH",
      });
      alert("Đã phê duyệt thành công!");
      loadRegistrations();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Không thể phê duyệt: " + (err.message || "Lỗi không xác định"));
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xóa đăng ký này?")) return;
    try {
      await apiClient(`/vehicle-registrations/${id}`, { method: "DELETE" });
      alert("Đã xóa thành công!");
      loadRegistrations();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Không thể xóa: " + (err.message || "Lỗi không xác định"));
    }
  };

  if (loading) {
    return <div>Đang tải danh sách...</div>;
  }

  if (error) {
    return (
      <div>
        <div style={{ color: "#dc2626", padding: "1rem" }}>{error}</div>
        <button onClick={loadRegistrations}>Thử lại</button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>Danh sách đăng ký mới</h2>

      {registrations.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Không có đăng ký mới nào cần phê duyệt
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {registrations.map((reg) => (
            <div
              key={reg._id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "1rem",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Chủ sở hữu
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {reg.ownerName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Biển số xe
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {reg.licensePlate}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Loại phương tiện
                  </div>
                  <div style={{ marginTop: 2 }}>{reg.vehicleType}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>CCCD</div>
                  <div style={{ marginTop: 2 }}>{reg.cccd}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Số điện thoại
                  </div>
                  <div style={{ marginTop: 2 }}>{reg.phoneNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Email</div>
                  <div style={{ marginTop: 2 }}>{reg.email || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    MAC Address
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontFamily: "monospace",
                      fontSize: 13,
                    }}
                  >
                    {reg.macAddress}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Ngày đăng ký
                  </div>
                  <div style={{ marginTop: 2 }}>
                    {new Date(reg.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              {reg.notes && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Ghi chú</div>
                  <div
                    style={{
                      marginTop: 4,
                      padding: "0.5rem",
                      background: "#f8fafc",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    {reg.notes}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleApprove(reg._id)}
                  disabled={approving === reg._id}
                  style={{
                    flex: 1,
                    padding: "0.5rem 1rem",
                    background: approving === reg._id ? "#94a3b8" : "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: approving === reg._id ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {approving === reg._id ? "Đang phê duyệt..." : "✓ Phê duyệt"}
                </button>
                <button
                  onClick={() => handleDelete(reg._id)}
                  disabled={approving === reg._id}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: approving === reg._id ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  ✕ Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
