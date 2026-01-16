import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState("");

  const loadOrders = () => {
    setLoading(true);
    api.get("/orders")
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
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
      console.error("Error details:", error.response?.data || error.message);
      alert("Failed to update order status. Please try again.");
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
      case 'PENDING': return '⏳';
      case 'ACCEPTED': return '✅';
      case 'PACKED': return '📦';
      case 'DELIVERED': return '🚚';
      default: return '❓';
    }
  };

  const getActionButton = (order) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📋 Orders Management</h1>
              <p className="text-indigo-100 text-lg">Manage and track all customer orders efficiently</p>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl opacity-20">🛒</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by customer or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-semibold text-gray-700">Filter Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="ALL">All Orders</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="ACCEPTED">✅ Accepted</option>
                <option value="PACKED">📦 Packed</option>
                <option value="DELIVERED">🚚 Delivered</option>
              </select>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <div className="text-sm opacity-90">Total Orders</div>
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
            </div>
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
            <div className="text-6xl mb-4">📭</div>
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
                    <div className="text-2xl">{getStatusIcon(order.status)}</div>
                    <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {order.status}
                    </span>
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
