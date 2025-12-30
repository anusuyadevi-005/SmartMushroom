import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Environment from "./pages/Environment";
import Batch from "./pages/Batch";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import TrackOrder from "./pages/TrackOrder";


function App() {
  return (
    <BrowserRouter>
  <Navbar />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/environment" element={<Environment />} />
    <Route path="/batch" element={<Batch />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/products" element={<Products />} />
  <Route path="/orders" element={<Orders />} />
    <Route path="/adminlogin" element={<AdminLogin />} />
    <Route path="/login" element={<Login />} />
    <Route path="/track" element={<TrackOrder />} />



</Routes>
</BrowserRouter>

  );
}

export default App;
