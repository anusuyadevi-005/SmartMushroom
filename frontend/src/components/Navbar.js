import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div style={navStyle}>
      <h3>AgroSense 🍄</h3>

      <div>
        <Link to="/" style={link}>Home</Link>
        <Link to="/dashboard" style={link}>Dashboard</Link>
        <Link to="/batch" style={link}>Create Batch</Link>
        <Link to="/environment" style={link}>Environment</Link>
        <Link to="/products" style={link}>Shop</Link>
        <Link to="/orders" style={link}>Orders</Link>
      </div>
    
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

export default Navbar;
