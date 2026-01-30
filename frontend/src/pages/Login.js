import React, { useState } from "react";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleLogin = () => {
    window.location.href = "http://localhost:5000/login/google";
  };

  const login = async () => {
    setError("");
    setLoading(true);
    try {
      let res;

      // Try standard user login first
      try {
        res = await api.post("/auth/login", { email, password });
      } catch (err) {
        // If user login fails with invalid credentials, try admin login
        if (err?.response?.status === 401 || err?.response?.status === 400) {
          res = await api.post("/admin/login", { email, password });
        } else {
          throw err;
        }
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "admin") {
        window.location.href = "/admindashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-amber-100 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Sign in to AgroSense</h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div className="space-y-4">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-amber-600 text-white rounded px-4 py-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">or</p>
            <button onClick={googleLogin} className="mt-2 w-full border rounded px-3 py-2">Continue with Google</button>
          </div>

          <p className="text-sm text-gray-600">Don't have an account? <a href="/signup" className="text-amber-600">Sign up</a></p>
          <p className="text-sm text-gray-600 mt-2">If you're an admin, sign in with your admin credentials — this form will detect and redirect you to the admin panel.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
