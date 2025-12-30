import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      {/* HERO SECTION */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Smart Agriculture <br /> Starts with <span style={{ color: "#a5d6a7" }}>AgroSense</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Monitor cultivation batches, track environment conditions, 
            manage mushroom orders and grow smarter — all in one platform.
          </p>

          <div style={styles.heroButtons}>
            <button style={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
              View Dashboard
            </button>
            <button style={styles.secondaryBtn} onClick={() => navigate("/batch")}>
              Create Batch
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={styles.features}>
        <Feature
          title="🌱 Batch Management"
          desc="Create, track and manage cultivation batches with real-time status."
        />
        <Feature
          title="🌡️ Environment Monitoring"
          desc="Monitor expiry, safety status and environment health instantly."
        />
        <Feature
          title="🛒 Smart Orders"
          desc="Place and manage mushroom orders with live tracking."
        />
        <Feature
          title="📊 Analytics Dashboard"
          desc="Visual insights for batches, orders and expiry trends."
        />
      </section>

      {/* WHY AGROSENSE */}
      <section style={styles.why}>
        <h2>Why AgroSense?</h2>
        <p>
          AgroSense helps farmers and agri-businesses reduce waste,
          improve productivity and make data-driven decisions.
        </p>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2>Ready to Grow Smarter?</h2>
        <button style={styles.primaryBtn} onClick={() => navigate("/dashboard")}>
          Get Started
        </button>
      </section>
    </div>
  );
}

/* FEATURE CARD */
function Feature({ title, desc }) {
  return (
    <div style={styles.featureCard}>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* STYLES */
const styles = {
  page: {
    fontFamily: "Segoe UI, sans-serif",
    color: "#2e2e2e"
  },

  hero: {
    minHeight: "80vh",
    background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 60px"
  },

  heroContent: {
    maxWidth: "700px"
  },

  heroTitle: {
    fontSize: "52px",
    marginBottom: "20px",
    lineHeight: "1.2"
  },

  heroSubtitle: {
    fontSize: "18px",
    marginBottom: "30px",
    color: "#e8f5e9"
  },

  heroButtons: {
    display: "flex",
    gap: "15px"
  },

  primaryBtn: {
    padding: "14px 28px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    background: "#66bb6a",
    color: "#1b5e20",
    cursor: "pointer",
    fontWeight: "bold"
  },

  secondaryBtn: {
    padding: "14px 28px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "2px solid #a5d6a7",
    background: "transparent",
    color: "#e8f5e9",
    cursor: "pointer"
  },

  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
    padding: "80px 60px",
    background: "#f5f7f6"
  },

  featureCard: {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },

  why: {
    padding: "60px",
    textAlign: "center"
  },

  cta: {
    padding: "60px",
    background: "#2e7d32",
    color: "white",
    textAlign: "center"
  }
};

export default Home;
