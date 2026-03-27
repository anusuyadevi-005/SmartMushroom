import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { Clipboard, ShoppingCart, Search, Hourglass, CheckCircle, Box, Truck, Inbox, HelpCircle } from "lucide-react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const loadOrders = () => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      setLoading(false);
      setError("Admin access required to view this page.");
      setErrorStatus(403);
      return;
    }

    setLoading(true);
    setError("");
    api.get("/orders/")
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load orders:", err);
        const status = err.response?.status;
        const serverMsg = err.response?.data?.error || err.response?.data || err.message;

        if (status === 422) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setError("Session invalid or malformed token. Please sign in again.");
          setErrorStatus(422);
        } else if (status === 401) {
          setError("Authentication required. Please sign in to access admin actions.");
          setErrorStatus(401);
        } else if (status === 403) {
          setError(`Access Denied (403): ${serverMsg || "Admin access required."}`);
          setErrorStatus(status);
        } else {
          setError(`[VERIFIED-UPDATE] Failed to load orders (${status || 'Network Error'}): ${serverMsg || "Please try again later."}`);
          setErrorStatus(status || 500);
        }

        console.debug("Orders load error details:", serverMsg);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = (order, status) => {
    console.log("Updating order status:", order, "to:", status);
    console.log("Sending data:", {
      orderId: order._id,
      status: status
    });
    api.put("/orders/status", {
      orderId: order._id,
      status: status
    })
      .then((response) => {
        console.log("Status update successful:", response);
        loadOrders();
      })
      .catch((error) => {
        console.error("Status update failed:", error);
        const serverErr = error.response?.data;
        const errorMsg = serverErr?.error || "Failed to update order status.";
        const details = serverErr?.details ? `\n\nDetails: ${serverErr.details}` : "";
        const identity = serverErr?.identity ? `\nIdentity: ${serverErr.identity}` : "";

        alert(`${errorMsg}${details}${identity}\n\nPlease try again or check your account role.`);
      });
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [orders, filterStatus, searchTerm]);

  const sortedOrders = useMemo(() => {
    let sortableItems = [...filteredOrders];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredOrders, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'from-yellow-400 to-yellow-500';
      case 'ACCEPTED': return 'from-blue-400 to-blue-500';
      case 'PACKED': return 'from-purple-400 to-purple-500';
      case 'DELIVERED': return 'from-green-400 to-green-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Hourglass className="inline mr-2 text-lg" />;
      case 'ACCEPTED': return <CheckCircle className="inline mr-2 text-lg" />;
      case 'PACKED': return <Box className="inline mr-2 text-lg" />;
      case 'DELIVERED': return <Truck className="inline mr-2 text-lg" />;
      default: return <HelpCircle className="inline mr-2 text-lg" />;
    }
  };

  const getActionButton = (order) => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      return null;
    }

    switch (order.status) {
      case 'PENDING':
      case 'PLACED':
        return (
          <button
            onClick={() => {
              console.log("Accept button clicked for order:", order);
              updateStatus(order, "ACCEPTED");
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Accept Order
          </button>
        );
      case 'ACCEPTED':
        return (
          <button
            onClick={() => {
              console.log("Pack button clicked for order:", order);
              updateStatus(order, "PACKED");
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Pack Order
          </button>
        );
      case 'PACKED':
        return (
          <button
            onClick={() => {
              console.log("Deliver button clicked for order:", order);
              updateStatus(order, "DELIVERED");
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  const viewOrder = (order) => {
    if (!order) return;
    const id = order._id || order.id || '';
    if (id) window.location.href = `/orders/${id}`;
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

  const exportCSV = (data) => {
    try {
      const rows = (data || []).map(o => ({
        id: o._id || '',
        customer: o.customerName || '',
        product: o.product || '',
        quantity: o.quantity || '',
        status: o.status || '',
        total: o.total || (o.price ? (o.price * (o.quantity || 1)) : ''),
        date: o.createdAt || o.date || ''
      }));

      const header = Object.keys(rows[0] || { id: '', customer: '', product: '', quantity: '', status: '', total: '', date: '' });
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2"><Clipboard className="inline -mt-1 mr-2" /> Orders Management</h1>
              <p className="text-indigo-100 text-lg">Manage and track all customer orders efficiently</p>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl opacity-20"><ShoppingCart className="w-16 h-16 opacity-20" /></div>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Clipboard className="text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Fulfillment</div>
              <div className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'PENDING' || o.status === 'PLACED').length}</div>
              <div className="text-xs text-red-500 mt-1">-5% vs last week</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <Hourglass className="text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Recent Revenue</div>
              <div className="text-2xl font-bold text-gray-900">${(orders.reduce((s, o) => s + (parseFloat(o.total || (o.price * (o.quantity || 1)) || 0) || 0), 0)).toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-1">+18% vs last month</div>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <ShoppingCart className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex-1 md:max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportCSV(filteredOrders)}
                className="bg-white border border-green-200 text-green-700 px-4 py-2 rounded-lg shadow-sm hover:bg-green-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Export CSV
              </button>

              <button
                onClick={() => window.location.href = '/orders/new'}
                className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:shadow-md flex items-center gap-2"
              >
                <span className="text-lg font-bold">+</span>
                New Order
              </button>
            </div>
          </div>

          {/* Quick Filter Dropdown */}
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PACKED">Packed</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading orders...</p>
          </div>
        ) : sortedOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4"><Inbox className="w-16 h-16 inline" /></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          /* Orders Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOrders.map((order, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${getStatusColor(order.status)} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl">{getStatusIcon(order.status)}</div>
                      <span className="ml-3 text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                        {order.status}
                      </span>
                    </div>

                    <div className="relative" data-order-id={order._id || index}>
                      <button
                        onClick={() => toggleDropdown(order._id || index)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-lg"
                        aria-haspopup="true"
                        aria-expanded={openDropdown === (order._id || index)}
                      >
                        •••
                      </button>

                      {openDropdown === (order._id || index) && (
                        <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded-lg shadow-lg border z-50">
                          <button onClick={() => { viewOrder(order); toggleDropdown(order._id || index); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">View Details</button>
                          <button onClick={() => { copyOrderId(order); toggleDropdown(order._id || index); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Copy Order ID</button>
                          <button onClick={() => { exportCSV([order]); toggleDropdown(order._id || index); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Export Order</button>
                          {(order.status === 'PENDING' || order.status === 'PLACED') && (
                            <button onClick={() => { if (window.confirm('Cancel this order?')) { updateStatus(order, 'CANCELLED'); } toggleDropdown(order._id || index); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cancel Order</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</div>
                      <div className="text-lg font-semibold text-gray-900">{order.customerName}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</div>
                      <div className="text-md text-gray-700">{order.product}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</div>
                        <div className="text-xl font-bold text-indigo-600">{order.quantity}</div>
                      </div>
                      <div className="text-right">
                        {getActionButton(order)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="text-xs text-gray-500 text-center">
                    Order #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
