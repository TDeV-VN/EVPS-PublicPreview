import React from "react";

export default function UserHome({
  onSelectMap,
  onSelectPriorityVehicles,
  onSelectSignals,
  onSelectNewRegistrations,
}) {
  const cards = [
    {
      key: "map",
      title: "Bản đồ trực tuyến",
      description: "Xem vị trí và trạng thái ưu tiên",
      onClick: onSelectMap,
      disabled: false,
    },
    {
      key: "new-registrations",
      title: "Danh sách đăng ký mới",
      description: "Duyệt các đăng ký phương tiện mới",
      onClick: onSelectNewRegistrations,
      disabled: false,
    },
    {
      key: "priority-vehicles",
      title: "Danh sách phương tiện ưu tiên",
      description: "Xem danh sách xe ưu tiên",
      onClick: onSelectPriorityVehicles,
      disabled: false,
    },
    {
      key: "signals",
      title: "Danh sách đèn tín hiệu",
      description: "Xem và tạo đèn tín hiệu",
      onClick: onSelectSignals,
      disabled: false,
    },
  ];

  return (
    <div style={{ padding: "2rem 0" }}>
      <h2 style={{ color: "#fff", marginBottom: "1.5rem" }}>EVPS</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        {cards.map((card) => (
          <button
            key={card.key}
            onClick={() => !card.disabled && card.onClick?.()}
            disabled={card.disabled}
            style={{
              background: "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1.25rem 1rem",
              textAlign: "center",
              cursor: card.disabled ? "not-allowed" : "pointer",
              opacity: card.disabled ? 0.45 : 1,
              minHeight: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "0.5rem",
            }}
            aria-disabled={card.disabled}
          >
            <div style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.4 }}>
              {card.title}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
              {card.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
