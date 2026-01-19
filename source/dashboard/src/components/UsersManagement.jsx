import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";
import { listUsers, deleteUser } from "../utils/apiClient.js";
import RegisterForm from "./RegisterForm.jsx";
import Button from "@mui/material/Button";

export default function UsersManagement({ onBack }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const fetchAll = async () => {
    setError(null);
    setLoading(true);
    try {
      const { users, meta } = await listUsers();
      // Chỉ hiển thị user có role là "user"
      const filteredUsers = users.filter((u) => u.role === "user");
      setItems(filteredUsers);
      setMeta(meta);
    } catch (err) {
      setError(err.message || "Không lấy được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchAll();
  }, [user?.role]);

  if (user?.role !== "admin") return null;

  if (showRegisterForm) {
    return (
      <RegisterForm onBack={() => setShowRegisterForm(false)} isAdmin={true} />
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Quản lý người dùng</h2>
      <div
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}
      >
        <Button onClick={fetchAll} disabled={loading} variant="contained">
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
        <Button
          onClick={() => setShowRegisterForm(true)}
          variant="contained"
          color="primary"
        >
          Tạo tài khoản mới
        </Button>
        {error && <span style={{ color: "crimson" }}>{error}</span>}
        {meta && !error && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Tổng: {meta.total} {meta.message ? `| ${meta.message}` : ""}
          </span>
        )}
      </div>
      {deleteError && (
        <div style={{ color: "crimson", marginTop: 8 }}>{deleteError}</div>
      )}
      <div style={{ marginTop: 12 }}>
        {loading && <div>Đang tải danh sách...</div>}
        {!loading && items.length === 0 && <div>Chưa có người dùng nào.</div>}
        {!loading && items.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Họ tên</th>
                  <th style={th}>Email</th>
                  <th style={th}>Tạo lúc</th>
                  <th style={th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u, idx) => (
                  <tr key={u._id}>
                    <td style={td}>{idx + 1}</td>
                    <td style={td}>{u.fullName}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{new Date(u.createdAt).toLocaleString()}</td>
                    <td style={td}>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        disabled={u.role === "admin" || busyId === u._id}
                        onClick={async () => {
                          if (!confirm(`Xóa người dùng ${u.email}?`)) return;
                          setBusyId(u._id);
                          setDeleteError(null);
                          try {
                            await deleteUser(u._id);
                            setItems((prev) =>
                              prev.filter((x) => x._id !== u._id)
                            );
                          } catch (err) {
                            setDeleteError(
                              err.message || "Xóa thất bại, vui lòng thử lại"
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {busyId === u._id ? "Đang xóa..." : "Xóa"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
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
