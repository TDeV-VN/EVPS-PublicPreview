import React from "react";

/* ================== FEATURE CARD ================== */
const Feature = ({ title, description }) => (
  <div className="feature-card" style={styles.featureCard}>
    <h3 style={styles.featureTitle}>{title}</h3>
    <p style={styles.featureDesc}>{description}</p>
  </div>
);

/* ================== MAIN PAGE ================== */
export default function GuestHome({ onSelectRegisterVehicle, onSelectLogin }) {
  // Inject hover styles into the document head
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      .feature-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 30px rgba(16, 185, 129, 0.4);
      }
      .primary-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
      }
      .secondary-btn:hover {
        background-color: #334155;
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div style={styles.page}>
      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <h1 style={styles.heroTitle}>
          Hệ thống Ưu tiên Tín hiệu cho Xe Khẩn cấp
        </h1>
        <p style={styles.heroDesc}>
          EVPS là giải pháp thông minh giúp tối ưu hóa luồng giao thông, tạo làn
          sóng xanh cho phương tiện ưu tiên, giảm thời gian phản ứng và bảo vệ
          an toàn cộng đồng.
        </p>
      </section>

      {/* ================= FEATURES ================= */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          <Feature
            title="Điều khiển Tín hiệu Tự động"
            description="Nhận diện xe ưu tiên và điều chỉnh đèn giao thông theo thời gian thực."
          />
          <Feature
            title="Giám sát Thời gian thực"
            description="Theo dõi vị trí, tốc độ và trạng thái xe trên bản đồ trực quan."
          />
          <Feature
            title="Đăng ký An toàn"
            description="Quy trình xác thực nhanh chóng, đảm bảo tính minh bạch và bảo mật."
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section style={styles.cta}>
        <div style={styles.ctaGlow} />
        <h2 style={styles.ctaTitle}>Bắt đầu ngay hôm nay</h2>
        <p style={styles.ctaDesc}>
          Đăng ký phương tiện để được cấp quyền ưu tiên hoặc đăng nhập để quản
          lý hệ thống.
        </p>

        <div style={styles.ctaButtons}>
          <button
            onClick={onSelectRegisterVehicle}
            className="primary-btn"
            style={styles.primaryBtn}
          >
            Đăng ký Phương tiện
          </button>
          <button
            onClick={onSelectLogin}
            className="secondary-btn"
            style={styles.secondaryBtn}
          >
            Đăng nhập Hệ thống
          </button>
        </div>
      </section>
    </div>
  );
}

/* ================== STYLES ================== */
const styles = {
  page: {
    minHeight: "100vh",
    color: "#0f172a", // Dark text
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  /* HERO */
  hero: {
    position: "relative",
    textAlign: "center",
    padding: "8rem 1.5rem 7rem",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: "-50%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "150%",
    height: "150%",
    background:
      "radial-gradient(circle at center, rgba(16, 185, 129, 0.1), transparent 60%)", // Softer glow
    zIndex: 0,
  },
  heroTitle: {
    position: "relative",
    fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
    fontWeight: 800,
    marginBottom: "1.5rem",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    background: "linear-gradient(90deg, #059669, #10b981)", // Darker green gradient
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    zIndex: 1,
    padding: "0 1rem",
  },
  heroDesc: {
    position: "relative",
    maxWidth: "720px",
    margin: "0 auto",
    fontSize: "1.2rem",
    color: "#475569", // Darker gray for description
    lineHeight: 1.7,
    zIndex: 1,
    padding: "0 1rem",
  },

  /* FEATURES */
  featuresSection: {
    padding: "4rem 1.5rem",
  },
  featuresGrid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
  },
  featureCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    textAlign: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
  featureTitle: {
    fontSize: "1.4rem",
    fontWeight: 600,
    color: "#059669", // Dark green title
    marginBottom: "1rem",
  },
  featureDesc: {
    color: "#334155", // Darker text for description
    lineHeight: 1.6,
    margin: 0,
  },

  /* CTA */
  cta: {
    position: "relative",
    maxWidth: "1100px",
    margin: "4rem auto 5rem",
    padding: "5rem 2rem",
    textAlign: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  ctaGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(16, 185, 129, 0.1), transparent 50%)",
  },
  ctaTitle: {
    position: "relative",
    fontSize: "clamp(2rem, 5vw, 2.8rem)",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#1e293b", // Dark title
  },
  ctaDesc: {
    position: "relative",
    color: "#475569", // Darker gray description
    maxWidth: "620px",
    margin: "0 auto 2.5rem",
    lineHeight: 1.6,
    fontSize: "1.1rem",
  },
  ctaButtons: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "linear-gradient(90deg, #059669, #10b981)",
    border: "none",
    borderRadius: "12px",
    padding: "16px 36px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(5, 150, 105, 0.2)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  secondaryBtn: {
    background: "#e2e8f0", // Light gray background
    border: "none",
    borderRadius: "12px",
    padding: "16px 36px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1e293b", // Dark text
    cursor: "pointer",
    transition: "background-color 0.2s ease, transform 0.2s ease",
  },
};
