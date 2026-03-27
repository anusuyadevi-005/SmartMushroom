import React, { useState } from "react";
import api from "../services/api";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mushroomInterest, setMushroomInterest] = useState("Gourmet");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email || !password || !name) {
      setError("Name, email, and password are required");
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
        // Attempt admin signup
        res = await api.post("/admin/signup", { email, password, admin_key: adminKey });
      } else {
        res = await api.post("/auth/signup", {
          name,
          email,
          password,
          phone,
          address,
          mushroomInterest
        });
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setSuccess(true);
      if (res.data.role === "admin") {
        setTimeout(() => (window.location.href = "/admindashboard"), 1500);
      } else {
        setTimeout(() => (window.location.href = "/dashboard"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9f4] relative overflow-hidden font-sans py-12">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="max-w-xl w-full glass rounded-[2.5rem] shadow-2xl p-10 relative z-10 mx-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join AgroSense and start your mushroom journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-r-lg animate-pulse">
            <p className="font-bold">Success!</p>
            <p>Your account has been created. Redirecting...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Full Name</label>
            <input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
            <input
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Phone Number</label>
            <input
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Address / Location</label>
            <input
              placeholder="City, State, Country"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Primary Interest</label>
            <select
              value={mushroomInterest}
              onChange={(e) => setMushroomInterest(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
            >
              <option value="Gourmet">Gourmet Mushrooms</option>
              <option value="Medicinal">Medicinal Varieties</option>
              <option value="Growing">Growing Kits</option>
              <option value="Business">Bulk/Business</option>
              <option value="Research">Research/Study</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Admin Key (Optional)</label>
            <input
              placeholder="Enter key for staff account"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? "Creating Account..." : "Sign Up Now"}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account? <a href="/login" className="text-emerald-600 font-bold hover:underline underline-offset-4">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
