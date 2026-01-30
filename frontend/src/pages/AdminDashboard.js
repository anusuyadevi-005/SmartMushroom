import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Leaf, Box, FileText } from 'lucide-react';



function AdminDashboard() {
  // simple client-side guard
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
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
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
        const res = await api.get("/orders");
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
      setProductForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: ""
      });
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
      setProductForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: ""
      });
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
      await api.post("/dishes", dishData);
      setDishForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: ""
      });
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
      setDishForm({
        id: "",
        name: "",
        description: "",
        price: "",
        unit: "",
        image: "",
        features: ""
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-emerald-100 text-lg">Manage batches, orders, and products</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: "batches", label: "Batches", icon: <Leaf className="inline -mt-1 mr-2" /> },
                { id: "orders", label: "Orders", icon: <Box className="inline -mt-1 mr-2" /> },
                { id: "products", label: "Products", icon: <Leaf className="inline -mt-1 mr-2" /> },
                { id: "dishes", label: "Dishes", icon: <FileText className="inline -mt-1 mr-2" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Batches Tab */}
            {activeTab === "batches" && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Batch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Batch ID"
                      value={batchForm.batchId}
                      onChange={(e) => setBatchForm({...batchForm, batchId: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={batchForm.startDate}
                      onChange={(e) => setBatchForm({...batchForm, startDate: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Growth Days"
                      value={batchForm.growthDays}
                      onChange={(e) => setBatchForm({...batchForm, growthDays: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={createBatch}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    Create Batch
                  </button>
                </div>

                <div className="bg-white rounded-xl border">
                  <h3 className="text-lg font-semibold p-4 border-b">All Batches</h3>
                  {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Batch ID</th>
                          <th className="px-4 py-2 text-left">Start Date</th>
                          <th className="px-4 py-2 text-left">Expiry Date</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((batch) => (
                          <tr key={batch.batchId} className="border-t">
                            <td className="px-4 py-2">{batch.batchId}</td>
                            <td className="px-4 py-2">{batch.startDate}</td>
                            <td className="px-4 py-2">{batch.expiryDate}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-white text-xs ${
                                batch.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                              }`}>
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
              <div className="space-y-6">
                <div className="bg-white rounded-xl border">
                  <h3 className="text-lg font-semibold p-4 border-b">All Orders</h3>
                  {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                  ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No orders found.</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Order No</th>
                          <th className="px-4 py-2 text-left">Customer</th>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-t">
                            <td className="px-4 py-2">{order.orderNo}</td>
                            <td className="px-4 py-2">{order.customerName}</td>
                            <td className="px-4 py-2">{order.product}</td>
                            <td className="px-4 py-2">{order.quantity}</td>
                            <td className="px-4 py-2">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                className={`px-2 py-1 rounded text-white text-xs ${
                                  order.status === 'PENDING' ? 'bg-yellow-500' :
                                  order.status === 'PROCESSING' ? 'bg-blue-500' :
                                  order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <button className="text-blue-600 hover:text-blue-800">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingItem ? "Edit Product" : "Create New Product"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product ID"
                      value={productForm.id}
                      onChange={(e) => setProductForm({...productForm, id: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., kg, jar)"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={productForm.image}
                      onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Features (comma separated)"
                      value={productForm.features}
                      onChange={(e) => setProductForm({...productForm, features: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={editingItem ? updateProduct : createProduct}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      {editingItem ? "Update Product" : "Create Product"}
                    </button>
                    {editingItem && (
                      <button
                        onClick={() => {
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
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border">
                  <h3 className="text-lg font-semibold p-4 border-b">All Products</h3>
                  {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-lg font-bold text-green-600">₹{product.price} per {product.unit}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingItem ? "Edit Dish" : "Create New Dish"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Dish ID"
                      value={dishForm.id}
                      onChange={(e) => setDishForm({...dishForm, id: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Dish Name"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({...dishForm, name: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={dishForm.price}
                      onChange={(e) => setDishForm({...dishForm, price: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., plate, serving)"
                      value={dishForm.unit}
                      onChange={(e) => setDishForm({...dishForm, unit: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={dishForm.image}
                      onChange={(e) => setDishForm({...dishForm, image: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Features (comma separated)"
                      value={dishForm.features}
                      onChange={(e) => setDishForm({...dishForm, features: e.target.value})}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={dishForm.description}
                    onChange={(e) => setDishForm({...dishForm, description: e.target.value})}
                    className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg"
                    rows="3"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={editingItem ? updateDish : createDish}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
                    >
                      {editingItem ? "Update Dish" : "Create Dish"}
                    </button>
                    {editingItem && (
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setDishForm({
                            id: "",
                            name: "",
                            description: "",
                            price: "",
                            unit: "",
                            image: "",
                            features: ""
                          });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border">
                  <h3 className="text-lg font-semibold p-4 border-b">All Dishes</h3>
                  {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {dishes.map((dish) => (
                        <div key={dish.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{dish.name}</h4>
                          <p className="text-sm text-gray-600">{dish.description}</p>
                          <p className="text-lg font-bold text-orange-600">₹{dish.price} per {dish.unit}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => startEditDish(dish)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteDish(dish.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
    </div>
  );
}

export default AdminDashboard;
