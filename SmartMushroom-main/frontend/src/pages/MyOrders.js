import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import {
  FileText,
  ShoppingCart,
  Package,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RefreshCcw,
  Search,
  ExternalLink,
  MapPin,
  Trash2,
  Edit3,
  Star,
  X
} from "lucide-react";
import { Link } from "react-router-dom";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null); // { productId, productName }
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: "", body: "" });
  const [reviewHovered, setReviewHovered] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load my orders:', err);
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

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    return orders.filter(o =>
      o.orderNo?.toString().includes(searchQuery) ||
      o.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.items && o.items.some(item => (item.product || item.name).toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [orders, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const currentPageOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED': return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'SHIPPED': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Truck className="w-4 h-4" /> };
      case 'ACCEPTED': return { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'PACKED': return { bg: 'bg-violet-100', text: 'text-violet-700', icon: <Package className="w-4 h-4" /> };
      case 'CANCELLED': return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle className="w-4 h-4" /> };
      default: return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="w-4 h-4" /> };
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      alert('Failed to cancel order. Only pending orders can be cancelled.');
    }
  };

  const openReviewModal = (productId, productName) => {
    setReviewModal({ productId, productName });
    setReviewForm({ rating: 0, title: "", body: "" });
    setReviewHovered(0);
    setReviewError("");
    setReviewSuccess(false);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.rating) { setReviewError("Please select a star rating."); return; }
    if (!reviewForm.body.trim()) { setReviewError("Please write your review."); return; }
    setReviewSubmitting(true);
    try {
      await api.post(`/reviews/${reviewModal.productId}`, {
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body
      });
      setReviewSuccess(true);
    } catch (err) {
      const errorMsg = err?.response?.data?.details 
        ? `Failed to submit review: ${err.response.data.details}`
        : (err?.response?.data?.error || "Failed to submit review. Please try again.");
      setReviewError(errorMsg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-emerald-800 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Premium Header Overlay */}
      <div className="bg-emerald-800 text-white pt-12 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-extrabold flex items-center gap-3">
                <Package className="w-10 h-10" /> My Orders
              </h1>
              <p className="text-emerald-100 mt-2 opacity-90">Manage your purchases, track deliveries, and more.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-emerald-700/50 border border-emerald-600 rounded-full py-2.5 pl-10 pr-4 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-16 text-center border border-gray-100">
            <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">No Orders Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 text-lg">
              {searchQuery ? "We couldn't find any orders matching your search." : "Ready to start your sustainable mushroom journey?"}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-200"
            >
              Browse Products <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {currentPageOrders.map((o) => {
              const status = getStatusStyle(o.status);
              // Handle both multi-item and legacy single-product data structures
              const displayItems = o.items || [{ product: o.product, quantity: o.quantity, price: o.price }];

              return (
                <div key={o._id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all hover:shadow-2xl">
                  {/* Card Header Layer */}
                  <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
                    <div>
                      <div className="uppercase text-[10px] font-bold text-gray-400 tracking-wider">Order Placed</div>
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase text-[10px] font-bold text-gray-400 tracking-wider">Total Amount</div>
                      <div className="font-bold text-emerald-700 mt-0.5 text-base">₹{o.totalAmount || (o.price * o.quantity) || 0}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="uppercase text-[10px] font-bold text-gray-400 tracking-wider">Order ID</div>
                      <Link to={`/order-details/${o._id}`} className="font-mono text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5 block">
                        #{o.orderNo || o._id.slice(-8).toUpperCase()}
                      </Link>
                    </div>
                  </div>

                  {/* Card Body Layer */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Products List */}
                      <div className="flex-1 space-y-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} mb-4`}>
                          {status.icon} {o.status}
                        </div>

                        {displayItems.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start group">
                            <Link to={`/order-details/${o._id}`} className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 block">
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=150&h=150&fit=crop"}
                                alt={item.product || item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </Link>
                            <div className="flex-1">
                              <Link to={`/order-details/${o._id}`} className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors block">
                                {item.product || item.name}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">Quantity: <span className="font-semibold text-gray-700">{item.quantity}</span></p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Premium Quality</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Panel: Tracking & Actions */}
                      <div className="lg:w-72 lg:border-l lg:pl-8 space-y-4">
                        <div className="space-y-3">
                          <h5 className="text-[11px] font-extrabold uppercase text-gray-400 tracking-widest">Delivery Details</h5>
                          {o.shippingAddress ? (
                            <div className="flex gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <p className="leading-snug">{o.shippingAddress.name}<br />{o.shippingAddress.address?.slice(0, 40)}...</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No address provided</p>
                          )}
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                          <Link
                            to={`/track?orderNo=${o.orderNo || o._id}`}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> Track Package
                          </Link>

                          {o.status === "PENDING" && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => deleteOrder(o._id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-lg text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Cancel
                              </button>
                              <button
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-lg text-xs font-bold transition-all border border-blue-200 flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Modify
                              </button>
                            </div>
                          )}

                          {(o.status === "DELIVERED" || o.status === "SHIPPED") && (
                            <div className="flex flex-col gap-2">
                              <button
                                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold transition-all border border-gray-200 flex items-center justify-center gap-2"
                              >
                                <RefreshCcw className="w-4 h-4" /> Buy it Again
                              </button>
                              {o.status === "DELIVERED" && (() => {
                                const items = o.items || [{ product: o.product, id: o.product }];
                                return items.map((item, idx) => {
                                  const pid = item.variantId || (item.id || "").split("_")[0] || item.product;
                                  const pname = item.product || item.name || o.product;
                                  if (!pid) return null;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => openReviewModal(pid, pname)}
                                      className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2.5 rounded-lg text-sm font-bold transition-all border border-yellow-200 flex items-center justify-center gap-2"
                                    >
                                      <Star className="w-4 h-4" /> Rate & Review
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Professional Pagination */}
        {filteredOrders.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-12 gap-4">
            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900">{(page - 1) * pageSize + 1}</span> to <span className="text-gray-900">{Math.min(page * pageSize, filteredOrders.length)}</span> of <span className="text-gray-900">{filteredOrders.length}</span> orders
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === i + 1
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    : 'hover:bg-white hover:shadow-md text-gray-600'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Rate & Review Modal ── */}
      {reviewModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setReviewModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Rate & Review</h3>
                  <p className="text-yellow-50 text-sm mt-0.5 font-medium">{reviewModal.productName}</p>
                </div>
                <button
                  onClick={() => setReviewModal(null)}
                  className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {reviewSuccess ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-emerald-600 fill-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Thank you!</h4>
                <p className="text-gray-500 text-sm mb-6">Your review has been submitted successfully.</p>
                <button
                  onClick={() => setReviewModal(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitReview} className="p-6 space-y-5">
                {/* Star Picker */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">Your Rating *</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                        onMouseEnter={() => setReviewHovered(star)}
                        onMouseLeave={() => setReviewHovered(0)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star className={`w-9 h-9 transition-colors ${
                          star <= (reviewHovered || reviewForm.rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }`} />
                      </button>
                    ))}
                    {reviewForm.rating > 0 && (
                      <span className="ml-2 text-sm font-semibold text-gray-500 self-center">
                        {["","Terrible","Poor","Average","Good","Excellent"][reviewForm.rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Review Title</label>
                  <input
                    type="text"
                    placeholder="Summarize your experience (optional)"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                  />
                </div>

                {/* Review Body */}
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1">Your Review *</label>
                  <textarea
                    placeholder="What did you like or dislike? How was the quality, freshness, packaging?"
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm(f => ({ ...f, body: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                  />
                </div>

                {reviewError && (
                  <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{reviewError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-yellow-100"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewModal(null)}
                    className="px-5 bg-gray-50 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
