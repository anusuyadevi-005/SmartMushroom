import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { Leaf, Box, FileText, Search, Clipboard, CheckCircle, Hourglass, Package, Truck, XCircle, Settings, ClipboardList, X, User, Download } from 'lucide-react';

function AdminDashboard() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  const [activeTab, setActiveTab] = useState("batches");
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeBatches, setActiveBatches] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [totalDishesCount, setTotalDishesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  const [batchForm, setBatchForm] = useState({
    batchId: "",
    startDate: "",
    growthDays: 90
  });

  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    unit: "",
    image: "",
    features: ""
  });

  const [dishForm, setDishForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    unit: "",
    image: "",
    features: ""
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "batches") {
        const res = await api.get("/batch");
        setBatches(res.data);
      } else if (activeTab === "orders") {
        const res = await api.get("/orders/");
        setOrders(res.data);
      } else if (activeTab === "products") {
        const res = await api.get("/products");
        setProducts(res.data);
      } else if (activeTab === "dishes") {
        const res = await api.get("/dishes");
        setDishes(res.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [bRes, pRes, dRes, oRes] = await Promise.all([
          api.get('/batch'),
          api.get('/products'),
          api.get('/dishes'),
          api.get('/orders/')
        ]);

        const batchesList = bRes.data || [];
        const productsList = pRes.data || [];
        const dishesList = dRes.data || [];
        const ordersList = oRes.data || [];

        setTotalOrders(ordersList.length);
        setTotalProductsCount(productsList.length);
        setTotalDishesCount(dishesList.length);
        const active = batchesList.filter(b => b.status === 'ACTIVE' || !b.status).length;
        setActiveBatches(active);
      } catch (err) {
        console.debug('Summary load failed:', err);
      }
    };
    loadSummary();
  }, []);

  const createBatch = async () => {
    try {
      await api.post("/batch", batchForm);
      setBatchForm({ batchId: "", startDate: "", growthDays: 90 });
      loadData();
    } catch (error) {
      console.error("Error creating batch:", error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put("/orders/status", { orderId, status });
      loadData();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const createProduct = async () => {
    try {
      const productData = {
        ...productForm,
        features: productForm.features.split(",").map(f => f.trim())
      };
      await api.post("/products", productData);
      setProductForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
      loadData();
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const updateProduct = async () => {
    try {
      const productData = {
        ...productForm,
        features: productForm.features.split(",").map(f => f.trim())
      };
      await api.put(`/products/${editingItem.id}`, productData);
      setEditingItem(null);
      setProductForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
      loadData();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${productId}`);
        loadData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const startEditProduct = (product) => {
    setEditingItem(product);
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      image: product.image,
      features: product.features.join(", ")
    });
  };

  const createDish = async () => {
    try {
      const dishData = {
        ...dishForm,
        features: dishForm.features.split(",").map(f => f.trim())
      };
      await api.post("/dishes", dishForm);
      setDishForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
      loadData();
    } catch (error) {
      console.error("Error creating dish:", error);
    }
  };

  const updateDish = async () => {
    try {
      const dishData = {
        ...dishForm,
        features: dishForm.features.split(",").map(f => f.trim())
      };
      await api.put(`/dishes/${editingItem.id}`, dishData);
      setEditingItem(null);
      setDishForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
      loadData();
    } catch (error) {
      console.error("Error updating dish:", error);
    }
  };

  const deleteDish = async (dishId) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await api.delete(`/dishes/${dishId}`);
        loadData();
      } catch (error) {
        console.error("Error deleting dish:", error);
      }
    }
  };

  const startEditDish = (dish) => {
    setEditingItem(dish);
    setDishForm({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      unit: dish.unit,
      image: dish.image,
      features: dish.features.join(", ")
    });
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    if (searchTerm) {
      filtered = filtered.filter(order =>
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.product && order.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.orderNo && order.orderNo.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.items && order.items.some(item => (item.product || item.name || '').toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    return filtered;
  }, [orders, filterStatus, searchTerm]);

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': 'bg-amber-100 text-amber-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'ACCEPTED': 'bg-indigo-100 text-indigo-800',
      'PACKED': 'bg-violet-100 text-violet-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Hourglass className="inline w-4 h-4" />;
      case 'PROCESSING': return <Package className="inline w-4 h-4" />;
      case 'ACCEPTED': return <CheckCircle className="inline w-4 h-4" />;
      case 'PACKED': return <Box className="inline w-4 h-4" />;
      case 'COMPLETED': return <Truck className="inline w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="inline w-4 h-4" />;
      default: return <Clipboard className="inline w-4 h-4" />;
    }
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  const copyOrderId = async (order) => {
    try {
      const id = order._id || order.id || '';
      if (!id) return alert('No order id');
      await navigator.clipboard.writeText(id);
      alert('Order ID copied to clipboard');
    } catch (e) {
      console.error('copy failed', e);
      alert('Failed to copy Order ID');
    }
  };

  const exportOrderCSV = (data) => {
    try {
      const rows = (data || []).map(o => ({
        id: o._id || '',
        orderNo: o.orderNo || '',
        customer: o.customerName || '',
        product: o.product || '',
        quantity: o.quantity || '',
        status: o.status || '',
        total: o.total || (o.price ? (o.price * (o.quantity || 1)) : ''),
        date: o.createdAt || o.date || ''
      }));

      const header = Object.keys(rows[0] || { id: '', orderNo: '', customer: '', product: '', quantity: '', status: '', total: '', date: '' });
      const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(',')).join('\n'));
      const csvStr = csv.join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV', e);
      alert('Failed to export CSV.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage batches, orders, and products</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{totalOrders}</div>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Active Batches</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{activeBatches}</div>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Products</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{totalProductsCount}</div>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Dishes</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{totalDishesCount}</div>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="bg-white border border-gray-200 mb-6 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Order Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((s) => {
              const count = orders.filter(o => o.status === s).length;
              const percent = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={s} className="p-3 bg-gray-50 border border-gray-100">
                  <div className="text-sm font-medium text-gray-600">{s}</div>
                  <div className="text-xl font-semibold text-gray-900 mt-1">{count}</div>
                  <div className="h-1.5 bg-gray-200 mt-2">
                    <div className="h-1.5 bg-gray-600" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percent}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex px-4">
              {[
                { id: "batches", label: "Batches", icon: <Leaf className="inline w-4 h-4 mr-2" /> },
                { id: "orders", label: "Orders", icon: <Box className="inline w-4 h-4 mr-2" /> },
                { id: "products", label: "Products", icon: <Leaf className="inline w-4 h-4 mr-2" /> },
                { id: "dishes", label: "Dishes", icon: <FileText className="inline w-4 h-4 mr-2" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 border-b-2 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-gray-800 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Batches Tab */}
            {activeTab === "batches" && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New Batch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Batch ID"
                      value={batchForm.batchId}
                      onChange={(e) => setBatchForm({...batchForm, batchId: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="date"
                      value={batchForm.startDate}
                      onChange={(e) => setBatchForm({...batchForm, startDate: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Growth Days"
                      value={batchForm.growthDays}
                      onChange={(e) => setBatchForm({...batchForm, growthDays: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>
                  <button
                    onClick={createBatch}
                    className="mt-4 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm"
                  >
                    Create Batch
                  </button>
                </div>

                <div className="border border-gray-200">
                  <h3 className="text-sm font-semibold p-4 border-b bg-gray-50">All Batches</h3>
                  {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((batch) => (
                          <tr key={batch.batchId} className="border-t">
                            <td className="px-4 py-2 text-sm text-gray-900">{batch.batchId}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{batch.startDate}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{batch.expiryDate}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 text-xs font-medium ${batch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {batch.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 p-4">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="flex-1 md:max-w-md">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search orders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-9 pr-3 py-2 border border-gray-300 text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">Filter:</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 text-sm bg-white"
                      >
                        <option value="ALL">All Orders</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PACKED">Packed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>

                      <button
                        onClick={() => exportOrderCSV(filteredOrders)}
                        className="bg-white border border-gray-300 text-gray-700 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-gray-500 text-sm">Loading...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 p-12 text-center">
                    <Clipboard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Orders Found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => {
                          const itemsCount = order.items ? order.items.length : 1;
                          const firstProductName = order.items?.[0]?.product || order.items?.[0]?.name || order.product || 'Unknown';
                          const displayProduct = itemsCount > 1 ? `${firstProductName} +${itemsCount - 1} more` : firstProductName;
                          
                          return (
                            <tr key={order._id} className="border-t hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-2 text-sm text-gray-900 font-mono">#{order.orderNo || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-600 font-medium">{order.customerName}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {displayProduct}
                              </td>
                              <td className="px-4 py-2 text-sm font-bold text-emerald-700">₹{order.totalAmount || (order.price * (order.quantity || 1)) || 0}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${getStatusBadge(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1">{order.status}</span>
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => { setSelectedOrder(order); setShowOrderPanel(true); }}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                  >
                                    View
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={() => toggleDropdown(order._id)}
                                      className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    {openDropdown === order._id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-2xl z-[100] rounded-xl overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                                        <button onClick={() => { setSelectedOrder(order); setShowOrderPanel(true); toggleDropdown(order._id); }} className="block w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50">View Detailed Order</button>
                                        <button onClick={() => { copyOrderId(order); toggleDropdown(order._id); }} className="block w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50">Copy Database ID</button>
                                        <button onClick={() => { exportOrderCSV([order]); toggleDropdown(order._id); }} className="block w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50">Export to CSV</button>
                                        <div className="border-t border-gray-50 my-1"></div>
                                        <div className="px-4 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Status</div>
                                        {['PENDING', 'ACCEPTED', 'PACKED', 'COMPLETED', 'CANCELLED'].map(s => (
                                          <button 
                                            key={s} 
                                            onClick={() => { updateOrderStatus(order._id, s); toggleDropdown(order._id); }}
                                            className={`block w-full text-left px-4 py-1 text-[10px] font-bold ${order.status === s ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                          >
                                            • {s}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingItem ? "Edit Product" : "Create New Product"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product ID"
                      value={productForm.id}
                      onChange={(e) => setProductForm({...productForm, id: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., kg, jar)"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={productForm.image}
                      onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Features (comma separated)"
                      value={productForm.features}
                      onChange={(e) => setProductForm({...productForm, features: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full mt-4 px-3 py-2 border border-gray-300 text-sm"
                    rows="2"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={editingItem ? updateProduct : createProduct}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm"
                    >
                      {editingItem ? "Update Product" : "Create Product"}
                    </button>
                    {editingItem && (
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setProductForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200">
                  <h3 className="text-sm font-semibold p-4 border-b bg-gray-50">All Products</h3>
                  {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 p-4">
                          <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{product.description}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-2">₹{product.price} per {product.unit}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dishes Tab */}
            {activeTab === "dishes" && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingItem ? "Edit Dish" : "Create New Dish"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Dish ID"
                      value={dishForm.id}
                      onChange={(e) => setDishForm({...dishForm, id: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Dish Name"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({...dishForm, name: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={dishForm.price}
                      onChange={(e) => setDishForm({...dishForm, price: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., plate, serving)"
                      value={dishForm.unit}
                      onChange={(e) => setDishForm({...dishForm, unit: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={dishForm.image}
                      onChange={(e) => setDishForm({...dishForm, image: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Features (comma separated)"
                      value={dishForm.features}
                      onChange={(e) => setDishForm({...dishForm, features: e.target.value})}
                      className="px-3 py-2 border border-gray-300 text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={dishForm.description}
                    onChange={(e) => setDishForm({...dishForm, description: e.target.value})}
                    className="w-full mt-4 px-3 py-2 border border-gray-300 text-sm"
                    rows="2"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={editingItem ? updateDish : createDish}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm"
                    >
                      {editingItem ? "Update Dish" : "Create Dish"}
                    </button>
                    {editingItem && (
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setDishForm({ id: "", name: "", description: "", price: "", unit: "", image: "", features: "" });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200">
                  <h3 className="text-sm font-semibold p-4 border-b bg-gray-50">All Dishes</h3>
                  {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {dishes.map((dish) => (
                        <div key={dish.id} className="border border-gray-200 p-4">
                          <h4 className="text-sm font-medium text-gray-900">{dish.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{dish.description}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-2">₹{dish.price} per {dish.unit}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => startEditDish(dish)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDish(dish.id)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Detailed Order Side Panel */}
      {showOrderPanel && selectedOrder && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowOrderPanel(false)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> Order #{selectedOrder.orderNo || '-'}
                </h2>
                <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-black opacity-70">{selectedOrder._id}</p>
              </div>
              <button 
                onClick={() => setShowOrderPanel(false)}
                className="p-2 hover:bg-emerald-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Info */}
              <section className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Name</p>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Phone</p>
                    <p className="text-sm font-bold text-gray-900">{selectedOrder.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Address</p>
                    <p className="text-sm font-bold text-gray-900 italic leading-relaxed">{selectedOrder.address || 'No address provided'}</p>
                  </div>
                </div>
              </section>

              {/* Order Items */}
              <section>
                <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Items ({selectedOrder.items?.length || 1})
                </h3>
                <div className="space-y-3">
                  {(selectedOrder.items || [{ product: selectedOrder.product, quantity: selectedOrder.quantity, price: selectedOrder.price }]).map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                      <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.product || item.name || 'Unknown Product'}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                          <span>Qty: <span className="text-gray-900">{item.quantity}</span></span>
                          <span>•</span>
                          <span>Price: <span className="text-emerald-700">₹{item.price}</span></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-800">₹{item.price * (item.quantity || 1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Order Metadata */}
              <section className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest decoration-emerald-500 decoration-2">Status History</p>
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-tighter rounded-full ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                      <p className="text-[10px] text-emerald-800/50 font-black uppercase mb-1">Total Paid</p>
                      <p className="text-2xl font-black text-emerald-900">₹{selectedOrder.totalAmount || (selectedOrder.price * selectedOrder.quantity) || 0}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl text-center">
                      <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Created At</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setShowOrderPanel(false)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close Panel
              </button>
              <button 
                onClick={() => { exportOrderCSV([selectedOrder]); }}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
