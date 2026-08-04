import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Environment from "./pages/Environment";
import Batch from "./pages/Batch";
import BatchManagement from "./pages/BatchManagement";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import TrackOrder from "./pages/TrackOrder";

import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import StockManagement from "./pages/StockManagement";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Chatbot from "./components/Chatbot";

// Handles the redirect from Google OAuth — saves token+role, routes to correct dashboard
function GoogleAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const role = params.get("role");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "user");
    }

    if (role === "admin") {
      navigate("/admindashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return <div style={{ textAlign: "center", marginTop: "4rem" }}>Signing you in...</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/batch" element={<Batch />} />
        <Route path="/batch/:batchId" element={<BatchManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/myorders" element={<MyOrders />} />
        <Route path="/order-details/:orderId" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/track" element={
          localStorage.getItem("role") === "admin" ? <AdminDashboard /> : <TrackOrder />
        } />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/stock-management" element={<StockManagement />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Google OAuth callback handler */}
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      </Routes>
      {/* 🍄 Global AI Chatbot — visible on all pages */}
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
