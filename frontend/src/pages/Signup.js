import React, { useState } from "react";
import api from "../services/api";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const submit = async () => {
    setError("");
    setSuccess(false);

    if (!validate()) return;

    setLoading(true);
    try {
      let res;
      if (adminKey && adminKey.trim()) {
        // Attempt admin signup (requires ADMIN_KEY on server)
        res = await api.post("/admin/signup", { email, password, admin_key: adminKey });
      } else {
        res = await api.post("/auth/signup", { name, email, password });
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setSuccess(true);
      if (res.data.role === "admin") {
        setTimeout(() => (window.location.href = "/admindashboard"), 1000);
      } else {
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-amber-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create an account</h2>

        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">Signup successful! Redirecting...</div>}

        <div className="space-y-4">
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
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
          <input
            placeholder="Admin key (optional)"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-2"
          />

          <p className="text-xs text-gray-500 mt-1">Provide an <strong>Admin Key</strong> only if you are creating an admin account (server must be configured with ADMIN_KEY).</p>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-amber-600 text-white rounded px-4 py-2"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>

          <p className="text-sm text-gray-600">Already have an account? <a href="/login" className="text-amber-600">Sign in</a></p>
          <p className="text-sm text-gray-600 mt-2">To create an admin account, use the <a href="/signup" className="text-amber-600">Sign up</a> form and provide the Admin Key (if required).</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
