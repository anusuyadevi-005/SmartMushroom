import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

function Navbar() {
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const ref = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const getEmailFromToken = (t) => {
    if (!t) return null;
    try {
      const payload = t.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      return data.email || (data.sub && data.sub.email) || (data.identity && data.identity.email) || null;
    } catch (e) {
      return null;
    }
  };

  const userEmail = getEmailFromToken(token);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={navStyle}>
      <h3 className="flex items-center gap-2"><ShoppingCart className="inline -mt-1" /> AgroSense</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/" style={link}>Home</Link>
        <Link to="/dashboard" style={link}>Dashboard</Link>
        {role === "admin" && (
          <Link to="/batch" style={link}>Create Batch</Link>
        )}
        {role === "admin" && (
          <Link to="/environment" style={link}>Environment</Link>
        )}
        <Link to="/products" style={link}>Shop</Link>
        {role === "admin" && <Link to="/orders" style={link}>Orders</Link> }

        {/* Single Account Card Button */}
        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(!open)}
            style={accountButtonStyle}
            aria-expanded={open}
          >
            {token ? (role === "admin" ? "Admin" : "Account") : "Sign in / Sign up"}
          </button>

          {/* Backdrop for mobile overlay */}
          {isMobile && open && (
            <div style={backdropStyle} onClick={() => setOpen(false)} aria-hidden="true"></div>
          )}

          {open && (
            <div style={isMobile ? mobileCardStyle : cardStyle} role="menu" aria-label="Account menu">
              {token ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userEmail && (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{userEmail}</div>
                  )}
                  {role === "admin" && (
                    <Link to="/admindashboard" style={cardLink} onClick={() => setOpen(false)}>Admin Panel</Link>
                  )}
                  {role === "user" && (
                    <Link to="/myorders" style={cardLink} onClick={() => setOpen(false)}>My Orders</Link>
                  )}
                  <Link to={role === "admin" ? "/admindashboard" : "/dashboard"} style={cardLink} onClick={() => setOpen(false)}>Dashboard</Link>
                  <button onClick={logout} style={logoutButton}>Logout</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Link to="/login" style={cardLink} onClick={() => setOpen(false)}>Sign in</Link>
                  <Link to="/signup" style={cardLink} onClick={() => setOpen(false)}>Sign up</Link>
                  <div style={{ height: 1, background: "#e5e7eb", margin: "6px 0" }}></div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Admins: use your admin credentials on Sign in; to create an admin, provide an Admin Key on the Sign up form.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframe for popup animation */}
      <style>{`@keyframes popup {0% {opacity: 0; transform: translateY(-8px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);}}`}</style>
    </div>
  );
}

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "15px",
  background: "#2d6a4f",
  color: "white"
};

const link = {
  marginLeft: "15px",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold"
};

const accountButtonStyle = {
  marginLeft: "15px",
  padding: "8px 12px",
  background: "#fff",
  color: "#2d6a4f",
  borderRadius: 8,
  border: "none",
  fontWeight: "700",
  cursor: "pointer"
};

const cardStyle = {
  position: "absolute",
  right: 0,
  top: "110%",
  minWidth: 220,
  background: "white",
  color: "#111827",
  padding: 12,
  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
  borderRadius: 8,
  zIndex: 40,
  animation: 'popup 160ms ease',
};

const mobileCardStyle = {
  position: "fixed",
  right: 12,
  left: 12,
  top: 72,
  background: "white",
  color: "#111827",
  padding: 16,
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  borderRadius: 10,
  zIndex: 60,
  animation: 'popup 160ms ease',
};

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  zIndex: 50
};

const cardLink = {
  color: "#111827",
  textDecoration: "none",
  fontWeight: 600
};

const logoutButton = {
  background: "#ef4444",
  color: "white",
  padding: "8px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontWeight: 700
};

export default Navbar;
