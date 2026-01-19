import React from "react";
import { useAuth } from "./state/AuthContext.jsx";
import { apiClient } from "./utils/apiClient.js";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import UserInfo from "./components/UserInfo.jsx";
import UsersManagement from "./components/UsersManagement.jsx";
import RegisterVehicleForm from "./components/RegisterVehicleForm.jsx";
import PriorityMap from "./components/PriorityMap.jsx";
import AdminHome from "./components/AdminHome.jsx";
import UserHome from "./components/UserHome.jsx";
import NewRegistrations from "./components/NewRegistrations.jsx";
import PriorityVehicles from "./components/PriorityVehicles.jsx";
import SignalsList from "./components/SignalsList.jsx";
import CreateSignalForm from "./components/CreateSignalForm.jsx";
import AdminSignalsList from "./components/AdminSignalsList.jsx";
import GuestHome from "./components/GuestHome.jsx";
import ForgotPasswordForm from "./components/ForgotPasswordForm.jsx";

const ChangePasswordModal = ({
  show,
  onClose,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  passwordSuccess,
  passwordSaving,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSubmit,
}) => {
  if (!show) return null;

  return (
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
        zIndex: 2000,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
        {passwordSuccess && (
          <div
            style={{
              color: "#059669",
              background: "#d1fae5",
              padding: 12,
              borderRadius: 6,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {passwordSuccess}
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
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCurrentPassword(!showCurrentPassword);
              }}
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
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowNewPassword(!showNewPassword);
              }}
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
          <p
            style={{
              fontSize: 12,
              color: "#64748b",
              margin: "4px 0 0 0",
            }}
          >
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và
            ký tự đặc biệt
          </p>
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
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirmPassword(!showConfirmPassword);
              }}
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
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
            onClick={onSubmit}
            disabled={passwordSaving}
            style={{
              padding: "10px 20px",
              background: passwordSaving ? "#94a3b8" : "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: passwordSaving ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {passwordSaving ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NavBar = ({
  user,
  showUserMenu,
  setShowUserMenu,
  onChangePassword,
  onUserInfo,
  onLogout,
  onHome,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      padding: "0.75rem 1.5rem",
      background: "#0f172a",
      borderBottom: "1px solid #334155",
      marginBottom: "2rem",
    }}
  >
    <h1
      onClick={onHome}
      style={{
        margin: 0,
        color: "#fff",
        fontSize: "1.5rem",
        cursor: "pointer",
        transition: "opacity 0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.target.style.opacity = "1")}
    >
      EVPS Dashboard
    </h1>
    {user && (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#334155";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1e293b";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        {showUserMenu && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 200,
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                {user.email}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </div>
            </div>
            <button
              onClick={() => {
                setShowUserMenu(false);
                onUserInfo();
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "14px",
                color: "#0f172a",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.target.style.background = "none")}
            >
              Thông tin tài khoản
            </button>
            <button
              onClick={() => {
                setShowUserMenu(false);
                onChangePassword();
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "14px",
                color: "#0f172a",
                transition: "background 0.2s",
                borderTop: "1px solid #e5e7eb",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.target.style.background = "none")}
            >
              Đổi mật khẩu
            </button>
            <button
              onClick={() => {
                setShowUserMenu(false);
                onLogout();
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "14px",
                color: "#dc2626",
                transition: "background 0.2s",
                borderTop: "1px solid #e5e7eb",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.target.style.background = "#fee2e2")}
              onMouseLeave={(e) => (e.target.style.background = "none")}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

export default function App() {
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState(null);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  // view: 'info' | 'users' | 'register-vehicle' | 'admin-home' | 'admin-map' | 'admin-new-registrations' | 'admin-priority-vehicles' | 'admin-users-management' | 'admin-signals' | 'user-home' | 'user-map' | 'user-priority-vehicles' | 'user-signals' | 'user-signals-create'
  const [view, setView] = React.useState("guest-home");

  const handleLogout = async () => {
    await logout();
    setView("guest-home");
    setShowRegister(false);
  };

  const validatePassword = (password) => {
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
    setPasswordSuccess(null);

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

    setPasswordSaving(true);
    try {
      await apiClient("/users/change-password", {
        method: "PUT",
        body: {
          currentPassword,
          newPassword,
        },
      });
      setPasswordSuccess("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Điều hướng tự động theo role khi đăng nhập/đăng xuất
  React.useEffect(() => {
    if (!user) {
      setView("guest-home");
      return;
    }
    if (user?.role === "admin") {
      setView("admin-home");
    } else {
      setView("user-home");
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  const handleCloseModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <ChangePasswordModal
        show={showChangePasswordModal}
        onClose={handleCloseModal}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        passwordError={passwordError}
        passwordSuccess={passwordSuccess}
        passwordSaving={passwordSaving}
        showCurrentPassword={showCurrentPassword}
        setShowCurrentPassword={setShowCurrentPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        onSubmit={handleChangePassword}
      />
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        onChangePassword={() => setShowChangePasswordModal(true)}
        onUserInfo={() => {
          if (user?.role === "admin") {
            setView("admin-user-info");
          } else {
            setView("user-user-info");
          }
        }}
        onLogout={handleLogout}
        onHome={() => {
          if (user?.role === "admin") {
            setView("admin-home");
          } else if (user) {
            setView("user-home");
          } else {
            setView("guest-home");
          }
        }}
      />
      {view === "guest-home" ? (
        <GuestHome
          onSelectLogin={() => setView("login")}
          onSelectRegisterVehicle={() => setView("register-vehicle")}
        />
      ) : view === "login" ? (
        <LoginForm onForgotPassword={() => setView("forgot-password")} />
      ) : view === "forgot-password" ? (
        <ForgotPasswordForm onBack={() => setView("login")} />
      ) : (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem" }}>
          {view === "admin-home" ? (
            <AdminHome
              onSelectMap={() => setView("admin-map")}
              onSelectNewRegistrations={() =>
                setView("admin-new-registrations")
              }
              onSelectPriorityVehicles={() =>
                setView("admin-priority-vehicles")
              }
              onSelectUsersManagement={() => setView("admin-users-management")}
              onSelectSignals={() => setView("admin-signals")}
            />
          ) : view === "admin-map" ? (
            <PriorityMap />
          ) : view === "admin-new-registrations" ? (
            <NewRegistrations onBack={() => setView("admin-home")} />
          ) : view === "admin-priority-vehicles" ? (
            <PriorityVehicles onBack={() => setView("admin-home")} />
          ) : view === "admin-users-management" ? (
            <UsersManagement onBack={() => setView("admin-home")} />
          ) : view === "admin-signals" ? (
            <AdminSignalsList
              onBack={() => setView("admin-home")}
              onCreateNew={() => setView("admin-signals-create")}
            />
          ) : view === "admin-signals-create" ? (
            <CreateSignalForm
              onBack={() => setView("admin-signals")}
              onSuccess={() => setView("admin-signals")}
            />
          ) : view === "admin-user-info" ? (
            <UserInfo
              onGotoUsers={() => setView("admin-users-management")}
              onGotoRegisterVehicle={() => setView("register-vehicle")}
            />
          ) : view === "user-home" ? (
            <UserHome
              onSelectMap={() => setView("user-map")}
              onSelectPriorityVehicles={() => setView("user-priority-vehicles")}
              onSelectSignals={() => setView("user-signals")}
              onSelectNewRegistrations={() => setView("user-new-registrations")}
            />
          ) : view === "user-map" ? (
            <PriorityMap />
          ) : view === "user-priority-vehicles" ? (
            <PriorityVehicles onBack={() => setView("user-home")} />
          ) : view === "user-new-registrations" ? (
            <NewRegistrations onBack={() => setView("user-home")} />
          ) : view === "user-signals" ? (
            <SignalsList
              onBack={() => setView("user-home")}
              onCreateNew={() => setView("user-signals-create")}
            />
          ) : view === "user-signals-create" ? (
            <CreateSignalForm
              onBack={() => setView("user-signals")}
              onSuccess={() => setView("user-signals")}
            />
          ) : view === "user-user-info" ? (
            <UserInfo
              onGotoUsers={() => setView("user-home")}
              onGotoRegisterVehicle={() => setView("register-vehicle")}
            />
          ) : view === "info" ? (
            <UserInfo
              onManageUsers={() => setView("users")}
              onGotoRegisterVehicle={() => setView("register-vehicle")}
            />
          ) : view === "users" ? (
            <UsersManagement onBack={() => setView("info")} />
          ) : view === "register-vehicle" ? (
            <RegisterVehicleForm
              onSuccess={() => {
                if (user?.role === "admin") {
                  setView("admin-home");
                } else if (user) {
                  setView("user-home");
                } else {
                  setView("guest-home");
                }
              }}
              onClose={() => {
                if (user?.role === "admin") {
                  setView("admin-home");
                } else if (user) {
                  setView("user-home");
                } else {
                  setView("guest-home");
                }
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
