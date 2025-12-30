import React, { useState } from "react";
import api from "../services/api";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    api.post("/admin/login", { email, password })
      .then(res => {
        localStorage.setItem("token", res.data.token);
        alert("Login successful");
        window.location.href = "/dashboard";
      })
      .catch(() => alert("Invalid credentials"));
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Admin Login</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br /><br />
      <button onClick={login}>Login</button>
    </div>
  );
}

export default AdminLogin;
