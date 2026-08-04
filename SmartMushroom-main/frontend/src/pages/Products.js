import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { ShoppingCart, Plus, Edit3, Trash2, Leaf, Award, Check, Search, FileText, Heart, X, Info, Star, ThumbsUp, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCart, saveCart } from "../services/cartService";

// ─────────────────────────────────────────────────────────────
// ReviewSection — self-contained review component
// ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 6 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`transition-transform ${onChange ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
          disabled={!onChange}
        >
          <Star
            className={`w-${size} h-${size} transition-colors ${
              star <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSection({ productId, isAdmin }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [formError, setFormError] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!token && role !== "admin";

  // Decode email from JWT
  const getEmail = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.email || (payload.identity && payload.identity.email) || payload.sub || null;
    } catch { return null; }
  };
  const currentEmail = getEmail();

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/${productId}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avgRating || 0);
      setCount(res.data.count || 0);

      // Check if current user already reviewed
      if (currentEmail) {
        const mine = (res.data.reviews || []).find(r => r.userEmail === currentEmail);
        setAlreadyReviewed(!!mine);
      }
    } catch (e) {
      console.error("Failed to fetch reviews:", e);
    } finally {
      setLoading(false);
    }
  }, [productId, currentEmail]);

  // Check if user can write a review (has delivered order)
  const checkCanReview = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get("/orders/my");
      const orders = res.data || [];
      const hasDelivered = orders.some(o => {
        if (o.status !== "DELIVERED") return false;
        const items = o.items || [{ product: o.product, id: o.product }];
        return items.some(item =>
          (item.variantId || "").startsWith(productId) ||
          (item.id || "").startsWith(productId) ||
          item.product === productId
        );
      });
      setCanReview(hasDelivered);
    } catch { setCanReview(false); }
  }, [isLoggedIn, productId]);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchReviews, 30000);
    return () => clearInterval(interval);
  }, [fetchReviews, checkCanReview]);

  const submitReview = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.rating) { setFormError("Please select a star rating."); return; }
    if (!form.body.trim()) { setFormError("Please write your review."); return; }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${productId}`, {
        rating: form.rating,
        title: form.title,
        body: form.body
      });
      setForm({ rating: 0, title: "", body: "" });
      setShowForm(false);
      await fetchReviews();
      setAlreadyReviewed(true);
    } catch (err) {
      setFormError(err?.response?.data?.error || "Failed to submit review. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      await fetchReviews();
    } catch { alert("Failed to delete review."); }
  };

  // Rating distribution for bar chart
  const distribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: count > 0 ? Math.round((reviews.filter(r => r.rating === star).length / count) * 100) : 0
  }));

  return (
    <div className="mt-4 border-t border-gray-100 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-gray-800">Customer Reviews</h3>
        <span className="text-sm text-gray-400 font-medium">({count} {count === 1 ? "review" : "reviews"})</span>
      </div>

      {/* Rating Summary */}
      {count > 0 && (
        <div className="flex gap-8 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-gray-800">{avgRating.toFixed(1)}</div>
            <StarRating value={Math.round(avgRating)} size={5} />
            <div className="text-xs text-gray-400 mt-1">{count} ratings</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count: c, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3 font-semibold">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button / Form */}
      {isLoggedIn && !alreadyReviewed && canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md text-sm"
        >
          <Star className="w-4 h-4" /> Write a Review
        </button>
      )}
      {isLoggedIn && alreadyReviewed && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
          <Check className="w-4 h-4" /> You have already reviewed this product.
        </div>
      )}
      {isLoggedIn && !canReview && !alreadyReviewed && (
        <div className="mb-4 text-sm text-gray-400 italic">
          Purchase and receive this product to leave a review.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={submitReview} className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-gray-800">Your Review</h4>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Star Rating *</label>
            <StarRating value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} size={7} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">Review Title</label>
            <input
              type="text"
              placeholder="Summarize your experience"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">Review *</label>
            <textarea
              placeholder="What did you like or dislike? Share your experience..."
              value={form.body}
              onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            />
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="px-5 bg-white border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.userName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 text-sm">{review.userName}</span>
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> Verified Purchase
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </span>
                    </div>
                    <StarRating value={review.rating} size={4} />
                    {review.title && <p className="font-semibold text-gray-800 mt-2 text-sm">{review.title}</p>}
                    <p className="text-gray-600 mt-1 text-sm leading-relaxed">{review.body}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Returns true ONLY when stock is explicitly set to 0
// undefined / null  → product predates the stock feature → treat as "in stock"
const isOOS = (p) => typeof p.stock === "number" && p.stock === 0;

function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    unit: "",
    image: "",
    features: "",
    discount: 0,
    stock: 0
  });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [myOrders, setMyOrders] = useState([]);
  const [myPhone, setMyPhone] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState("1kg");
  const [reviewSummaries, setReviewSummaries] = useState({}); // { productId: { avgRating, count } }

  // Multipliers for different weights
  const weightMultipliers = {
    "250g": 0.3,
    "500g": 0.55,
    "1kg": 1.0,
    "2kg": 1.9,
    "5kg": 4.5
  };

  const calculatePrice = (basePrice, weight, discount = 0) => {
    const multiplier = weightMultipliers[weight] || 1.0;
    const discountedBase = basePrice * (1 - (discount / 100));
    return Math.round(discountedBase * multiplier);
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products");
        const prods = res.data;
        setProducts(prods);
        // Load review summaries for all products in parallel
        const summaries = {};
        await Promise.all(prods.map(async (p) => {
          try {
            const rev = await api.get(`/reviews/${p.id}`);
            summaries[p.id] = { avgRating: rev.data.avgRating || 0, count: rev.data.count || 0 };
          } catch { summaries[p.id] = { avgRating: 0, count: 0 }; }
        }));
        setReviewSummaries(summaries);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    const loadWishlistIds = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/wishlist");
        setWishlistIds(res.data.map(item => item.id));
      } catch (err) {
        console.error("Error loading wishlist IDs:", err);
      }
    };

    const checkAdmin = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      setIsAdmin(token && role === "admin");
    };

    loadProducts();
    loadWishlistIds();
    checkAdmin();
  }, []);

  const orderNow = (product, weight = "1kg") => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login?redirect=products");
      return;
    }

    const price = calculatePrice(product.price, weight, product.discount);
    // "Buy Now" implementation: Replace cart with just this one item with variant info
    const buyNowCart = [{ 
      ...product, 
      id: `${product.id}_${weight}`, // Unique ID for variant
      variantId: product.id,
      name: `${product.name} (${weight})`,
      price: price,
      weight: weight,
      quantity: 1 
    }];
    saveCart(buyNowCart);

    // Redirect to checkout
    navigate("/checkout");
  };

  const getEmailFromToken = (t) => {
    if (!t) return null;
    try {
      const payload = t.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      // JWT identity may be a dict in older tokens or a string in newer tokens (under 'sub'). Check both.
      return data.email || (data.identity && data.identity.email) || data.sub || null;
    } catch (e) {
      return null;
    }
  };

  const addToCart = (product, weight = "1kg") => {
    const cart = getCart();
    const price = calculatePrice(product.price, weight, product.discount);
    const variantId = `${product.id}_${weight}`;
    
    const existing = cart.find(item => item.id === variantId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ 
        ...product, 
        id: variantId, // Treat variant as unique item
        variantId: product.id,
        name: `${product.name} (${weight})`,
        price: price,
        weight: weight,
        quantity: 1 
      });
    }
    saveCart(cart);
    alert(`${product.name} (${weight}) added to cart!`);
  };

  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to manage your wishlist");
      return;
    }

    const isWished = wishlistIds.includes(productId);
    try {
      if (isWished) {
        await api.post("/wishlist/remove", { productId });
        setWishlistIds(wishlistIds.filter(id => id !== productId));
      } else {
        await api.post("/wishlist/add", { productId });
        setWishlistIds([...wishlistIds, productId]);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
      alert("Action failed");
    }
  };

  const createProduct = async () => {
    // Basic validation
    if (!productForm.id.trim() || !productForm.name.trim() || !productForm.price || Number(productForm.price) <= 0 || !productForm.unit.trim()) {
      setProductError("Please provide product id, name, positive price and unit.");
      return;
    }
    setProductError("");

    // Client-side admin/token checks to catch auth issues early
    const token = localStorage.getItem('token');
    const roleToken = localStorage.getItem('role');
    console.debug('Admin create - token present:', !!token, 'role:', roleToken);
    if (!token || roleToken !== 'admin') {
      setProductError('Admin login required');
      alert('Admin login required. Please sign in as an admin to create products.');
      return;
    }

    setProductLoading(true);
    try {
      const productData = {
        ...productForm,
        price: Number(productForm.price),
        stock: productForm.stock !== "" && productForm.stock !== undefined
          ? Number(productForm.stock)
          : undefined,
        features: productForm.features ? productForm.features.split(",").map(f => f.trim()) : []
      };
      console.debug("Creating product (payload):", productData);
      await api.post("/products", productData);
      alert("Product created successfully");
      setProductForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: "",
        discount: 0,
        stock: 0
      });
      setEditingItem(null);
      // Reload products
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error creating product:", error, error?.response);
      const resData = error?.response?.data || {};
      const status = error?.response?.status;
      const msg = resData.error || resData.message || resData.details || resData.msg || error.message || 'Please try again.';
      setProductError(msg);
      alert(`Failed to create product (status ${status}): ${msg}\nResponse: ${JSON.stringify(resData)}`);
    } finally {
      setProductLoading(false);
    }
  };

  const updateProduct = async () => {
    // Basic validation
    if (!productForm.name.trim() || !productForm.price || Number(productForm.price) <= 0 || !productForm.unit.trim()) {
      setProductError("Please provide product name, positive price and unit.");
      return;
    }
    setProductError("");
    setProductLoading(true);
    try {
      const productData = {
        ...productForm,
        price: Number(productForm.price),
        stock: productForm.stock !== "" && productForm.stock !== undefined
          ? Number(productForm.stock)
          : undefined,
        features: productForm.features ? productForm.features.split(",").map(f => f.trim()) : []
      };
      await api.put(`/products/${editingItem.id}`, productData);
      alert("Product updated successfully");
      setEditingItem(null);
      setProductForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: "",
        discount: 0,
        stock: 0
      });
      // Reload products
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error updating product:", error);
      const resData = error?.response?.data || {};
      const msg = resData.error || resData.message || resData.details || error.message || 'Please try again.';
      setProductError(msg);
      alert(`Failed to update product: ${msg}`);
    } finally {
      setProductLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${productId}`);
        alert("Product deleted successfully");
        // Reload products
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (error) {
        console.error("Error deleting product:", error);
        const resData = error?.response?.data || {};
        const msg = resData.error || resData.message || resData.details || error.message || 'Please try again.';
        alert(`Failed to delete product: ${msg}`);
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
      features: product.features.join(", "),
      discount: product.discount || 0,
      // Keep empty string if product never had stock set, so we don't
      // accidentally mark old products as out-of-stock
      stock: product.stock !== undefined && product.stock !== null ? product.stock : ""
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setProductForm({
      id: "",
      name: "",
      description: "",
      price: "",
      unit: "",
      image: "",
      features: "",
      discount: 0,
      stock: 0
    });
  };

  const fetchMyOrders = async () => {
    if (!myPhone.trim()) {
      alert("Please enter your phone number");
      return;
    }
    try {
      const res = await api.get(`/orders/track/${myPhone}`);
      setMyOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Failed to fetch orders. Please check your phone number.");
    }
  };

  const startEditOrder = (order) => {
    setEditingOrder(order);
    setEditQuantity(order.quantity);
  };

  const updateOrder = async () => {
    try {
      await api.put(`/orders/${editingOrder._id}`, { quantity: editQuantity });
      alert("Order updated successfully!");
      setEditingOrder(null);
      fetchMyOrders(); // Refresh orders
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Only pending orders can be updated.");
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/orders/${orderId}`);
        alert("Order deleted successfully!");
        fetchMyOrders(); // Refresh orders
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order. Only pending orders can be deleted.");
      }
    }
  };

  const cancelEditOrder = () => {
    setEditingOrder(null);
    setEditQuantity(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4"><ShoppingCart className="inline -mt-1 mr-3" /> Premium Mushroom Products</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Discover our range of fresh, organic oyster mushrooms and mushroom-based products.
            Sustainably grown with traditional farming methods for exceptional quality.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Admin Create Button */}
        {isAdmin && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setEditingItem({})}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="inline -mt-1 mr-2" /> Create New Product
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setExpandedProduct(product)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden cursor-pointer group"
            >
              {/* Product Image */}
              <div className="relative">
                {Array.isArray(product.image) ? (
                  <div className="grid grid-cols-3 gap-1 h-48">
                    {product.image.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ))}
                  </div>
                ) : (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {product.discount > 0 && (
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-white/20 backdrop-blur-sm animate-pulse">
                        <Award className="w-3 h-3" />
                        <span>-{product.discount}% OFF</span>
                      </div>
                    </div>
                  )}

                  {/* Out of Stock overlay — only shows if stock explicitly set to 0 */}
                  {isOOS(product) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <span className="bg-red-600 text-white font-black text-sm px-4 py-2 rounded-full shadow-xl uppercase tracking-widest border-2 border-white/30">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Stock badge for admin */}
                  {isAdmin && typeof product.stock === "number" && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow ${
                        isOOS(product)
                          ? "bg-red-600 text-white border-red-400"
                          : product.stock <= 10
                          ? "bg-orange-500 text-white border-orange-300"
                          : "bg-emerald-600 text-white border-emerald-400"
                      }`}>
                        {isOOS(product) ? "Stock: 0 (Out)" : `Stock: ${product.stock} units`}
                      </span>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className={`p-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${wishlistIds.includes(product.id)
                        ? "bg-red-500 text-white"
                        : "bg-white text-gray-400 hover:text-red-500"
                        }`}
                    >
                      <Heart className={`w-5 h-5 ${wishlistIds.includes(product.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
                    {/* Star rating summary on card */}
                    {reviewSummaries[product.id] && reviewSummaries[product.id].count > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 mb-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${
                              s <= Math.round(reviewSummaries[product.id].avgRating)
                                ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                            }`} />
                          ))}
                        </div>
                        <span className="text-xs text-yellow-600 font-bold">{reviewSummaries[product.id].avgRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({reviewSummaries[product.id].count})</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {product.discount > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-emerald-600">₹{calculatePrice(product.price, "1kg", product.discount)}</span>
                            <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded border border-red-100 uppercase tracking-tight">Special Offer</span>
                             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Save ₹{product.price - calculatePrice(product.price, "1kg", product.discount)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-emerald-600">₹{product.price}</span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">/{product.unit}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">{product.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => startEditProduct(product)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Edit3 className="inline -mt-1 mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Trash2 className="inline -mt-1 mr-2" /> Delete
                    </button>
                  </div>
                )}

                {/* Order Button (hidden for admins) */}
                {!isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => !isOOS(product) && addToCart(product)}
                      disabled={isOOS(product)}
                      className={`flex-1 border-2 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isOOS(product)
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                          : "bg-white border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <ShoppingCart className="inline -mt-1 mr-2" />
                      {isOOS(product) ? "Out of Stock" : "Cart"}
                    </button>
                    <button
                      onClick={() => !isOOS(product) && orderNow(product)}
                      disabled={isOOS(product)}
                      className={`flex-1 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        isOOS(product)
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                          : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white hover:shadow-xl"
                      }`}
                    >
                      {isOOS(product) ? "Unavailable" : "Buy Now"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quality Assurance Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4"><Leaf className="inline -mt-1 mr-2" /> Our Quality Promise</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every product is carefully cultivated using sustainable farming practices,
              ensuring the highest quality and nutritional value for our customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4"><Leaf className="w-10 h-10 inline" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Organic Farming</h3>
              <p className="text-gray-600">Grown without harmful chemicals or pesticides</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Fresh Harvest</h3>
              <p className="text-gray-600">Harvested daily and delivered fresh to your door</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4"><Award className="w-10 h-10 inline" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Quality</h3>
              <p className="text-gray-600">Rigorous quality checks ensure only the best products</p>
            </div>
          </div>
        </div>

        {/* My Orders Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4"><FileText className="inline -mt-1 mr-2" /> My Orders</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track and manage your orders. You can update or cancel pending orders.
            </p>
          </div>

          {/* Phone Input */}
          <div className="flex gap-4 mb-8 max-w-md mx-auto">
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={myPhone}
              onChange={(e) => setMyPhone(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
            <button
              onClick={fetchMyOrders}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Search className="inline -mt-1 mr-2" /> View Orders
            </button>
          </div>

          {/* Orders List */}
          {myOrders.length > 0 && (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {order.product}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "ACCEPTED"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "PACKED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Order #{order.orderNo}</p>
                        <p>Quantity: {order.quantity}</p>
                        <p>Customer: {order.customerName}</p>
                      </div>
                    </div>
                    {order.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditOrder(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Edit3 className="inline -mt-1 mr-2" /> Edit
                        </button>
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Trash2 className="inline -mt-1 mr-2" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {myOrders.length === 0 && myPhone && (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found for this phone number.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{editingItem.id ? 'Edit Product' : 'Create Product'}</h3>
                  <p className="text-emerald-50">{editingItem.id ? 'Update product information' : 'Fill details to add a new product'}</p>
                </div>
                <button
                  onClick={cancelEdit}
                  className="text-white hover:text-gray-200 bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Edit Form */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={productForm.id}
                    onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={productForm.discount}
                    onChange={(e) => setProductForm({ ...productForm, discount: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity (units)
                    {productForm.stock === 0 && (
                      <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        ⚠ Out of Stock
                      </span>
                    )}
                    {productForm.stock > 0 && productForm.stock <= 10 && (
                      <span className="ml-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                        ⚠ Low Stock
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
                      productForm.stock === 0 ? "border-red-400 bg-red-50" :
                      productForm.stock <= 10 ? "border-orange-400 bg-orange-50" :
                      "border-gray-300"
                    }`}
                    placeholder="Enter available quantity"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Set to 0 to mark as <strong>Out of Stock</strong>. Customers won't be able to order.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features (comma separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.features}
                    onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={editingItem.id ? updateProduct : createProduct}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {editingItem.id ? "Update Product" : "Create Product"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Product Modal */}
      {expandedProduct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300"
          onClick={() => setExpandedProduct(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Image Area */}
              <div className="h-64 md:h-auto relative bg-gray-100 overflow-hidden">
                {Array.isArray(expandedProduct.image) ? (
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {expandedProduct.image.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${expandedProduct.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src={expandedProduct.image}
                    alt={expandedProduct.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Premium Quality
                  </span>
                </div>
              </div>

              {/* Right Column: Information Area */}
              <div className="p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{expandedProduct.name}</h2>
                    <div className="flex items-center gap-3">
                      {expandedProduct.discount > 0 ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl font-extrabold text-emerald-600">₹{calculatePrice(expandedProduct.price, selectedWeight, expandedProduct.discount)}</div>
                            <div className="text-xl text-gray-400 line-through">₹{calculatePrice(expandedProduct.price, selectedWeight, 0)}</div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-red-200">Flash Sale</div>
                            <div className="text-sm font-bold text-red-500">You save ₹{calculatePrice(expandedProduct.price, selectedWeight, 0) - calculatePrice(expandedProduct.price, selectedWeight, expandedProduct.discount)} ({expandedProduct.discount}% Off)</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-4xl font-extrabold text-emerald-600">₹{calculatePrice(expandedProduct.price, selectedWeight)}</div>
                      )}
                      <span className="text-gray-500 text-sm font-medium mt-auto mb-1">({selectedWeight})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExpandedProduct(null);
                      setSelectedWeight("1kg"); // Reset weight on close
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6 flex-grow">
                  {/* Weight Selection */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Select Quantity / Weight</h3>
                    <div className="flex flex-wrap gap-2">
                      {["250g", "500g", "1kg", "2kg", "5kg"].map((weight) => (
                        <button
                          key={weight}
                          onClick={() => setSelectedWeight(weight)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                            selectedWeight === weight
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-md scale-105"
                              : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed text-base italic border-l-4 border-emerald-500 pl-4 bg-emerald-50 py-2 rounded-r-lg">
                    "{expandedProduct.description}"
                  </p>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-emerald-500" /> Key Features
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {expandedProduct.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium Additional Info */}
                  <div className="bg-emerald-600/5 rounded-2xl p-6 border border-emerald-100 shadow-inner">
                    <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" /> Nutritional & Growth Info
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Cultivation</p>
                        <p className="text-sm text-gray-800 font-medium">100% Organic Soil</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Protein Content</p>
                        <p className="text-sm text-gray-800 font-medium">High (3.3g/100g)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Harvest Time</p>
                        <p className="text-sm text-gray-800 font-medium">Morning Fresh</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Vitamin Content</p>
                        <p className="text-sm text-gray-800 font-medium">Rich in B & D</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  {!isAdmin && (
                    <>
                      <button
                        onClick={() => !isOOS(expandedProduct) && addToCart(expandedProduct, selectedWeight)}
                        disabled={isOOS(expandedProduct)}
                        className={`flex-1 border-2 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform flex items-center justify-center gap-2 ${
                          isOOS(expandedProduct)
                            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                            : "bg-white border-emerald-500 text-emerald-600 hover:scale-[1.02] hover:bg-emerald-50 shadow-sm"
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {isOOS(expandedProduct) ? "Out of Stock" : "Add to Cart"}
                      </button>
                      <button
                        onClick={() => !isOOS(expandedProduct) && orderNow(expandedProduct, selectedWeight)}
                        disabled={isOOS(expandedProduct)}
                        className={`flex-1 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform flex items-center justify-center gap-2 ${
                          isOOS(expandedProduct)
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                            : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white hover:scale-[1.02] shadow-xl"
                        }`}
                      >
                        {isOOS(expandedProduct) ? "Currently Unavailable" : "Buy Now"}
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setExpandedProduct(null);
                        startEditProduct(expandedProduct);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-5 h-5" /> Edit Product Details
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Review Section — full width below the two columns */}
            <div className="px-8 pb-8">
              <ReviewSection productId={expandedProduct.id} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Products;
