import React, { useState, useEffect } from "react";
import api from "../services/api";
import { ShoppingCart, Plus, Edit3, Trash2, Leaf, Award, Check, Search, FileText } from "lucide-react";

function Products() {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
    product: ""
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    unit: "",
    image: "",
    features: ""
  });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [myOrders, setMyOrders] = useState([]);
  const [myPhone, setMyPhone] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    const checkAdmin = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      setIsAdmin(token && role === "admin");
    };

    loadProducts();
    checkAdmin();
  }, []);

  const orderNow = (product) => {
    setSelectedProduct(product);
    setForm({ ...form, product: product.name });
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

  const submitOrder = async () => {
    if (!form.customerName || !form.phone || !form.product) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const email = getEmailFromToken(token);
      const payload = { ...form };
      if (email) payload.email = email;

      const response = await api.post("/orders", payload);
      console.log("Order response:", response); // Debug log
      alert("Order placed successfully! We'll contact you soon.");
      setForm({ customerName: "", phone: "", quantity: 1, product: "" });
      setSelectedProduct(null);
    } catch (err) {
      console.error("Order error:", err); // Debug log
      alert(`Order failed: ${err.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const closeOrderForm = () => {
    setSelectedProduct(null);
    setForm({ customerName: "", phone: "", quantity: 1, product: "" });
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
        features: ""
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
        features: ""
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
      features: product.features.join(", ")
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
      features: ""
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
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <div className="text-2xl font-bold">₹{product.price}</div>
                  <div className="text-sm opacity-90">per {product.unit}</div>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4 leading-relaxed">{product.description}</p>

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
                  <button
                    onClick={() => orderNow(product)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                  <ShoppingCart className="inline -mt-1 mr-2" /> Order Now
                  </button>
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
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === "PENDING"
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

      {/* Order Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-emerald-100">₹{selectedProduct.price} per {selectedProduct.unit}</p>
                </div>
                <button
                  onClick={closeOrderForm}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Order Form */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Order Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span>{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{form.quantity} {selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>₹{selectedProduct.price}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>Total:</span>
                        <span>₹{selectedProduct.price * form.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={submitOrder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Check className="inline -mt-1 mr-2" /> Confirm Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{editingItem.id ? 'Edit Product' : 'Create Product'}</h3>
                  <p className="text-blue-100">{editingItem.id ? 'Update product information' : 'Fill details to add a new product'}</p>
                </div>
                <button
                  onClick={cancelEdit}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
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
                    onChange={(e) => setProductForm({...productForm, id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features (comma separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.features}
                    onChange={(e) => setProductForm({...productForm, features: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={editingItem.id ? updateProduct : createProduct}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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

    </div>
  );
}

export default Products;
