import React, { useState } from "react";
import { apiClient } from "../utils/apiClient.js";

const VEHICLE_TYPES = [
  { value: "ambulance", label: "Xe Cứu Thương (Ambulance)" },
  { value: "police", label: "Xe Cảnh Sát (Police)" },
  { value: "fire", label: "Xe Cứu Hỏa (Fire)" },
  { value: "escort", label: "Xe Hộ Tống (Escort)" },
];

export default function RegisterVehicleForm({ onSuccess, onClose }) {
  const [formData, setFormData] = useState({
    ownerName: "",
    cccd: "",
    email: "",
    phoneNumber: "",
    vehicleType: "",
    licensePlate: "",
    macAddress: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Tên chủ phương tiện là bắt buộc";
    }

    if (!formData.cccd || !/^\d{12}$/.test(formData.cccd)) {
      newErrors.cccd = "CCCD phải là 12 chữ số";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.phoneNumber || !/^\d{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại phải là 10-11 chữ số";
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = "Loại phương tiện là bắt buộc";
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = "Biển số định danh là bắt buộc";
    }

    if (
      !formData.macAddress ||
      !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.macAddress)
    ) {
      newErrors.macAddress =
        "Địa chỉ MAC không hợp lệ (ví dụ: 00:1A:2B:3C:4D:5E)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await apiClient("/vehicle-registrations", {
        method: "POST",
        body: formData,
      });

      setSuccessMessage(
        "✓ Đăng ký phương tiện thành công! Vui lòng chờ xét duyệt."
      );
      setFormData({
        ownerName: "",
        cccd: "",
        email: "",
        phoneNumber: "",
        vehicleType: "",
        licensePlate: "",
        macAddress: "",
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (error) {
      setErrorMessage(
        "✗ " + (error.message || "Đăng ký thất bại. Vui lòng thử lại.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Đăng Ký Phương Tiện Ưu Tiên
      </h2>

      {successMessage && (
        <div
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#d4edda",
            color: "#155724",
            borderRadius: "4px",
            border: "1px solid #c3e6cb",
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "4px",
            border: "1px solid #f5c6cb",
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Owner Name */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Tên chủ phương tiện
          </label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Nhập tên chủ phương tiện"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.ownerName ? "2px solid #dc3545" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.ownerName && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.ownerName}
            </span>
          )}
        </div>

        {/* CCCD */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            CCCD
          </label>
          <input
            type="text"
            name="cccd"
            value={formData.cccd}
            onChange={handleChange}
            placeholder="12 chữ số"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.cccd ? "2px solid #dc3545" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.cccd && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.cccd}
            </span>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.email ? "2px solid #dc3545" : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.email && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.email}
            </span>
          )}
        </div>

        {/* Phone Number */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="10-11 chữ số"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.phoneNumber
                ? "2px solid #dc3545"
                : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.phoneNumber && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.phoneNumber}
            </span>
          )}
        </div>

        {/* Vehicle Type */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Loại phương tiện ưu tiên
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.vehicleType
                ? "2px solid #dc3545"
                : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Chọn loại phương tiện --</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.vehicleType && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.vehicleType}
            </span>
          )}
        </div>

        {/* License Plate */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Biển số định danh
          </label>
          <input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            placeholder="Ví dụ: 29L-123456"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.licensePlate
                ? "2px solid #dc3545"
                : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.licensePlate && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.licensePlate}
            </span>
          )}
        </div>

        {/* MAC Address */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            Mã địa chỉ vĩ độ của thiết bị (MAC)
          </label>
          <input
            type="text"
            name="macAddress"
            value={formData.macAddress}
            onChange={handleChange}
            placeholder="00:1A:2B:3C:4D:5E"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: errors.macAddress
                ? "2px solid #dc3545"
                : "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box",
            }}
          />
          {errors.macAddress && (
            <span style={{ color: "#dc3545", fontSize: "0.875rem" }}>
              {errors.macAddress}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.75rem",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Đóng
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
