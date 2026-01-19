import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";
import { apiClient, requestPasswordRecovery } from "../utils/apiClient.js";

export default function UserInfo({ onGotoUsers, onGotoRegisterVehicle }) {
  const { user, logout, setUserFromRegister, refreshMe } = useAuth();
  const [detail, setDetail] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchDetail = async () => {
    setError(null);
    setRefreshing(true);
    try {
      const me = await apiClient("/users/me");
      setDetail(me);
      setFullName(me?.fullName || "");
    } catch (err) {
      setError(err.message || "Không lấy được thông tin người dùng");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Always fetch latest detail on mount
    (async () => {
      try {
        const me = await apiClient("/users/me");
        setDetail(me);
        setFullName(me?.fullName || "");
      } catch (err) {
        setError(err.message || "Không lấy được thông tin người dùng");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Đang tải thông tin...</div>;
  if (error)
    return (
      <div style={{ border: "1px solid #f5c2c7", padding: 12 }}>
        <p style={{ color: "crimson" }}>{error}</p>
        <button onClick={fetchDetail}>Thử lại</button>
      </div>
    );
  if (!detail) return <div>Không có dữ liệu người dùng.</div>;

  const validatePassword = (password) => {
    // Password phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Mật khẩu phải có ít nhất ${minLength} ký tự`;
    }
    if (!hasUpperCase) {
      return "Mật khẩu phải chứa ít nhất 1 chữ hoa";
    }
    if (!hasLowerCase) {
      return "Mật khẩu phải chứa ít nhất 1 chữ thường";
    }
    if (!hasNumber) {
      return "Mật khẩu phải chứa ít nhất 1 số";
    }
    if (!hasSpecialChar) {
      return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt";
    }
    return null;
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setSaveMsg(null);

    // Validate inputs
    if (!currentPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    setSaving(true);
    try {
      await apiClient("/users/change-password", {
        method: "PUT",
        body: {
          currentPassword,
          newPassword,
        },
      });
      setSaveMsg({
        type: "ok",
        text: "Đổi mật khẩu thành công! Email thông báo đã được gửi.",
      });
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setPasswordError(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {changingPassword && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setChangingPassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError(null);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 20 }}>Đổi mật khẩu</h3>
            {passwordError && (
              <div
                style={{
                  color: "#dc2626",
                  background: "#fee2e2",
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                {passwordError}
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Mật khẩu hiện tại:
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Mật khẩu mới:
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <small style={{ color: "#64748b", fontSize: 12 }}>
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường,
                số và ký tự đặc biệt
              </small>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Xác nhận mật khẩu mới:
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  background: saving ? "#94a3b8" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {saving ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: 22, color: "#333" }}>
          Thông tin người dùng
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ width: 100, color: "#555" }}>Họ tên:</strong>
            {!editing ? (
              <span>{detail.fullName}</span>
            ) : (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                }}
              />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ width: 100, color: "#555" }}>Email:</strong>
            <span>{detail.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <strong style={{ width: 100, color: "#555" }}>Vai trò:</strong>
            <span
              style={{
                background: detail.role === "admin" ? "#e0f2fe" : "#e0e7ff",
                color: detail.role === "admin" ? "#0ea5e9" : "#4f46e5",
                padding: "4px 10px",
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              {detail.role}
            </span>
          </div>
        </div>
        {saveMsg && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 6,
              background: saveMsg.type === "ok" ? "#dcfce7" : "#fee2e2",
              color: saveMsg.type === "ok" ? "#16a34a" : "#dc2626",
            }}
          >
            {saveMsg.text}
          </div>
        )}
      </div>
    </>
  );
}
