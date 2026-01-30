import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { FileText, ShoppingCart } from "lucide-react";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load my orders:', err);
      // If unauthorized, prompt to sign in
      if (err?.response?.status === 401 || err?.response?.status === 422) {
        if (window.confirm('You must be signed in to view your orders. Sign in now?')) {
          window.location.href = '/login';
        }
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const currentPageOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, page]);

  const startEdit = (order) => {
    setEditingOrderId(order._id);
    setEditQuantity(order.quantity || 1);
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    setEditQuantity(1);
  };

  const updateOrder = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}`, { quantity: editQuantity });
      alert('Order updated');
      setEditingOrderId(null);
      fetchOrders();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update order. Only pending orders can be updated.');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      alert('Order cancelled');
      fetchOrders();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to cancel order. Only pending orders can be cancelled.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold"><FileText className="inline -mt-1 mr-2" /> My Orders</h1>
          <p className="text-gray-600 mt-2">View and manage your recent orders. You can update or cancel orders that are still pending.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4"><ShoppingCart className="w-16 h-16 inline" /></div>
            <h3 className="text-2xl font-semibold mb-2">No Orders Yet</h3>
            <p className="text-gray-600">Visit the <a href="/products" className="text-amber-600 underline">Shop</a> to place your first order.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-4">
              {currentPageOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{o.product} × {o.quantity}</div>
                    <div className="text-xs text-gray-500">Placed: {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</div>
                    {o.note && <div className="text-xs text-gray-600 mt-1">Note: {o.note}</div>}
                  </div>

                  <div className="flex items-center gap-3">
                    {o.status === 'PENDING' ? (
                      editingOrderId === o._id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min={1} value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} className="w-20 px-3 py-2 border rounded" />
                          <button onClick={() => updateOrder(o._id)} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
                          <button onClick={cancelEdit} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(o)} className="px-3 py-2 bg-yellow-500 text-white rounded">Edit</button>
                          <button onClick={() => deleteOrder(o._id)} className="px-3 py-2 bg-red-600 text-white rounded">Cancel</button>
                        </div>
                      )
                    ) : (
                      <div className="text-sm px-3 py-1 rounded-lg bg-gray-100">{o.status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">Showing {Math.min((page-1)*pageSize + 1, orders.length)}–{Math.min(page*pageSize, orders.length)} of {orders.length} orders</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
                <div className="px-3 py-1 bg-gray-100 rounded">Page {page} / {totalPages}</div>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
