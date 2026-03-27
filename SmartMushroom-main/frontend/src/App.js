import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/batch" element={<Batch />} />
        <Route path="/batch/:id" element={<BatchManagement />} />
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
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />



      </Routes>
    </BrowserRouter>

  );
}

export default App;
