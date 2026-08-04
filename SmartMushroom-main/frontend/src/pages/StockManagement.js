import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import { Package, AlertTriangle, TrendingUp, TrendingDown, BarChart3, RefreshCw, Search, Clock, Plus, Minus, CheckCircle, XCircle, Archive, ArrowUpDown } from "lucide-react";

function StockManagement() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ adjustment: 0, reason: "" });
  const [adjusting, setAdjusting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [convertModal, setConvertModal] = useState(null);
  const [convertForm, setConvertForm] = useState({ targetProductId: "", sourceQty: 1, targetQty: 1 });
  const [converting, setConverting] = useState(false);
  const socketRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, alertRes, histRes] = await Promise.all([
        api.get("/stock/summary"),
        api.get("/stock/alerts"),
        api.get("/stock/history?limit=50")
      ]);
      setSummary(sumRes.data);
      setAlerts(alertRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error("Failed to load stock data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") {
      window.location.href = "/login";
      return;
    }
    loadData();
  }, [loadData]);

  // Socket.IO real-time updates
  useEffect(() => {
    try {
      const { io } = require("socket.io-client");
      const socket = io("http://127.0.0.1:5000");
      socketRef.current = socket;
      socket.on("stock_update", (payload) => {
        if (!payload?.id) return;
        setSummary(prev => {
          if (!prev) return prev;
          const updated = prev.products.map(p =>
            p.id === payload.id ? { ...p, stock: payload.stock, status: payload.stock === 0 ? "out_of_stock" : payload.stock <= 10 ? "low_stock" : "in_stock" } : p
          );
          const oos = updated.filter(p => p.status === "out_of_stock").length;
          const low = updated.filter(p => p.status === "low_stock").length;
          const total = updated.reduce((s, p) => s + (p.stock || 0), 0);
          return { ...prev, products: updated, outOfStockCount: oos, lowStockCount: low, totalItems: total };
        });
      });
      return () => { try { socket.disconnect(); } catch(e){} };
    } catch(e) { console.debug("Socket.IO not available", e); }
  }, []);

  const handleAdjust = async () => {
    if (!adjustModal || !adjustForm.adjustment) return;
    setAdjusting(true);
    try {
      await api.put(`/stock/${adjustModal.id}/adjust`, {
        adjustment: parseInt(adjustForm.adjustment),
        reason: adjustForm.reason || "Manual adjustment"
      });
      setAdjustModal(null);
      setAdjustForm({ adjustment: 0, reason: "" });
      loadData();
    } catch (err) {
      alert("Failed to adjust stock: " + (err.response?.data?.error || err.message));
    } finally {
      setAdjusting(false);
    }
  };

  const handleConvert = async () => {
    if (!convertModal || !convertForm.targetProductId || !convertForm.sourceQty || !convertForm.targetQty) return;
    setConverting(true);
    try {
      await api.post(`/stock/convert`, {
        sourceProductId: convertModal.id,
        targetProductId: convertForm.targetProductId,
        sourceQty: parseInt(convertForm.sourceQty),
        targetQty: parseInt(convertForm.targetQty),
        reason: "Converted expiring stock"
      });
      setConvertModal(null);
      setConvertForm({ targetProductId: "", sourceQty: 1, targetQty: 1 });
      loadData();
    } catch (err) {
      alert("Failed to convert stock: " + (err.response?.data?.error || err.message));
    } finally {
      setConverting(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "out_of_stock") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800", dot: "bg-red-500" };
    if (status === "low_stock") return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" };
    return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" };
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "order": return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "cancellation": return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "restock": return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "manual_adjust": return <ArrowUpDown className="w-4 h-4 text-purple-500" />;
      case "harvest": return <Archive className="w-4 h-4 text-teal-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      order: "bg-red-100 text-red-700",
      cancellation: "bg-blue-100 text-blue-700",
      restock: "bg-emerald-100 text-emerald-700",
      manual_adjust: "bg-purple-100 text-purple-700",
      harvest: "bg-teal-100 text-teal-700"
    };
    return styles[type] || "bg-gray-100 text-gray-700";
  };

  const filteredProducts = summary?.products?.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredHistory = history.filter(h => historyFilter === "all" || h.type === historyFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-zinc-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-400" /> Stock Management
              </h1>
              <p className="text-gray-400 mt-1">Real-time inventory tracking & management</p>
            </div>
            <button onClick={loadData} className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: summary?.totalProducts || 0, icon: <Package className="w-5 h-5" />, color: "from-blue-500 to-indigo-600" },
            { label: "Total Stock Items", value: summary?.totalItems || 0, icon: <BarChart3 className="w-5 h-5" />, color: "from-emerald-500 to-teal-600" },
            { label: "Low Stock", value: summary?.lowStockCount || 0, icon: <AlertTriangle className="w-5 h-5" />, color: "from-amber-500 to-orange-600" },
            { label: "Out of Stock", value: summary?.outOfStockCount || 0, icon: <XCircle className="w-5 h-5" />, color: "from-red-500 to-rose-600" }
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>{card.icon}</div>
              </div>
              <div className="text-3xl font-black text-gray-900">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5" /> Stock Alerts ({alerts.length})</h3>
            <div className="flex flex-wrap gap-2">
              {alerts.map(a => (
                <span key={a.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${a.severity === "critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                  {a.severity === "critical" ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {a.name}: {a.stock} units
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-2">
            <nav className="flex gap-1">
              {[
                { id: "overview", label: "Stock Overview", icon: <BarChart3 className="w-4 h-4" /> },
                { id: "history", label: "Movement History", icon: <Clock className="w-4 h-4" /> }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? "border-emerald-600 text-emerald-700 bg-emerald-50/50" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none" />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No products found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-4">Product</div>
                      <div className="col-span-2 text-center">Stock Level</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-center">Stock Bar</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {filteredProducts.map(product => {
                      const style = getStatusStyle(product.status);
                      const maxStock = Math.max(...(summary?.products?.map(p => p.stock || 0) || [1]), 1);
                      const barWidth = Math.min(100, ((product.stock || 0) / maxStock) * 100);
                      return (
                        <div key={product.id} className={`grid grid-cols-12 gap-4 items-center px-4 py-4 rounded-xl border ${style.border} ${style.bg} transition-all hover:shadow-md`}>
                          <div className="col-span-4 flex items-center gap-3">
                            {product.image && (
                              <img src={Array.isArray(product.image) ? product.image[0] : product.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-white shadow-sm" />
                            )}
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                              <div className="text-xs text-gray-400">ID: {product.id} · ₹{product.price}/{product.unit}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-2xl font-black text-gray-900">{product.stock || 0}</span>
                            <span className="text-xs text-gray-400 ml-1">units</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {product.status === "out_of_stock" ? "Out" : product.status === "low_stock" ? "Low" : "OK"}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className={`h-2.5 rounded-full transition-all duration-500 ${product.status === "out_of_stock" ? "bg-red-500" : product.status === "low_stock" ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${barWidth}%` }} />
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <button onClick={() => { setAdjustModal(product); setAdjustForm({ adjustment: 0, reason: "" }); }}
                              className="bg-white hover:bg-emerald-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:border-emerald-300">
                              <ArrowUpDown className="w-3 h-3" /> Adjust
                            </button>
                            <button onClick={() => { setConvertModal(product); setConvertForm({ targetProductId: "", sourceQty: 1, targetQty: 1 }); }}
                              className="bg-white hover:bg-purple-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:border-purple-300">
                              <RefreshCw className="w-3 h-3" /> Convert
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div>
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span className="text-xs font-bold text-gray-400 uppercase">Filter:</span>
                  {[
                    { id: "all", label: "All" },
                    { id: "order", label: "Orders" },
                    { id: "cancellation", label: "Cancellations" },
                    { id: "restock", label: "Restocks" },
                    { id: "manual_adjust", label: "Adjustments" }
                  ].map(f => (
                    <button key={f.id} onClick={() => setHistoryFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${historyFilter === f.id ? "bg-emerald-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No stock movements recorded yet</p>
                    <p className="text-sm mt-1">Stock changes from orders, cancellations, and adjustments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHistory.map((entry, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                          {getTypeIcon(entry.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{entry.productName || entry.productId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getTypeBadge(entry.type)}`}>
                              {entry.type?.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{entry.reason}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-black ${entry.changeQty > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {entry.changeQty > 0 ? "+" : ""}{entry.changeQty}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">→ {entry.newStock} units</div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 w-28 text-right">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAdjustModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Adjust Stock</h2>
            <p className="text-sm text-gray-500 mb-6">{adjustModal.name} — Current: <span className="font-bold text-gray-900">{adjustModal.stock || 0} units</span></p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Adjustment Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAdjustForm(f => ({ ...f, adjustment: Math.max(-999, (parseInt(f.adjustment) || 0) - 1) }))}
                    className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold hover:bg-red-200 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={adjustForm.adjustment} onChange={e => setAdjustForm(f => ({ ...f, adjustment: e.target.value }))}
                    className="flex-1 text-center text-2xl font-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none" />
                  <button onClick={() => setAdjustForm(f => ({ ...f, adjustment: (parseInt(f.adjustment) || 0) + 1 }))}
                    className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold hover:bg-emerald-200 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  New stock: <span className="font-bold text-gray-700">{Math.max(0, (adjustModal.stock || 0) + (parseInt(adjustForm.adjustment) || 0))} units</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Reason</label>
                <select value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none bg-white">
                  <option value="">Select a reason...</option>
                  <option value="New harvest received">New harvest received</option>
                  <option value="Stock count correction">Stock count correction</option>
                  <option value="Damaged/expired stock removed">Damaged/expired stock removed</option>
                  <option value="Supplier delivery">Supplier delivery</option>
                  <option value="Returned items added">Returned items added</option>
                  <option value="Sample/testing">Sample/testing</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleAdjust} disabled={adjusting || !adjustForm.adjustment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  {adjusting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {adjusting ? "Updating..." : "Confirm Adjustment"}
                </button>
                <button onClick={() => setAdjustModal(null)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Stock Modal */}
      {convertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConvertModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">Convert Stock</h2>
            <p className="text-sm text-gray-500 mb-6">Convert <span className="font-bold text-gray-900">{convertModal.name}</span> (Current: {convertModal.stock || 0} units) to another product.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Target Product</label>
                <select value={convertForm.targetProductId} onChange={e => setConvertForm(f => ({ ...f, targetProductId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-400 outline-none bg-white">
                  <option value="">Select product to create...</option>
                  {summary?.products?.filter(p => p.id !== convertModal.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.stock || 0})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Source Qty to Remove</label>
                  <input type="number" min="1" max={convertModal.stock || 0} value={convertForm.sourceQty} onChange={e => setConvertForm(f => ({ ...f, sourceQty: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-400 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Target Qty to Add</label>
                  <input type="number" min="1" value={convertForm.targetQty} onChange={e => setConvertForm(f => ({ ...f, targetQty: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-400 outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleConvert} disabled={converting || !convertForm.targetProductId || convertForm.sourceQty < 1 || convertForm.targetQty < 1}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  {converting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {converting ? "Converting..." : "Confirm Conversion"}
                </button>
                <button onClick={() => setConvertModal(null)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;
