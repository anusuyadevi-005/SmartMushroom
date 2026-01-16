import React, { useState } from "react";
import api from "../services/api";

function Products() {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
    product: ""
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const products = [
    {
      id: "fresh-oyster",
      name: "Fresh Oyster Mushroom",
      description: "Premium fresh oyster mushrooms, harvested daily for maximum freshness and nutritional value.",
      price: 450,
      unit: "kg",
      image: "https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400&h=300&fit=crop&crop=center",
      features: ["Organic & Fresh", "High Protein", "Rich in Antioxidants", "Locally Grown"]
    },
    {
      id: "dried-oyster",
      name: "Dried Oyster Mushroom",
      description: "Convenient dried mushrooms that retain all nutritional benefits with extended shelf life.",
      price: 850,
      unit: "kg",
      image: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=400&h=300&fit=crop&crop=center",
      features: ["Long Shelf Life", "Concentrated Flavor", "Easy Storage", "Year-round Availability"]
    },
    {
      id: "mushroom-pickle",
      name: "Mushroom Pickle",
      description: "Delicious pickled mushrooms with traditional spices, perfect as a side dish or appetizer.",
      price: 320,
      unit: "jar (500g)",
      image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&crop=center",
      features: ["Authentic Taste", "No Preservatives", "Ready to Eat", "Traditional Recipe"]
    },
    {
      id: "mushroom-powder",
      name: "Mushroom Powder",
      description: "Finely ground mushroom powder perfect for cooking, soups, and health supplements.",
      price: 1200,
      unit: "kg",
      image: "https://images.unsplash.com/photo-1582515073490-39981397c445?w=400&h=300&fit=crop&crop=center",
      features: ["Versatile Use", "Nutrient Dense", "Long Shelf Life", "Cooking Essential"]
    },
    {
      id: "mushroom-tea",
      name: "Mushroom Herbal Tea",
      description: "Soothing herbal tea blend with medicinal mushrooms for health and wellness.",
      price: 280,
      unit: "box (20 bags)",
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&crop=center",
      features: ["Health Benefits", "Natural Relaxation", "Immune Support", "Caffeine Free"]
    },
    {
      id: "bulk-wholesale",
      name: "Bulk Wholesale",
      description: "Large quantity orders for restaurants, retailers, and distributors with special pricing.",
      price: 380,
      unit: "kg (min 10kg)",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center",
      features: ["Bulk Discount", "Business Pricing", "Custom Packaging", "Reliable Supply"]
    }
  ];

  const orderNow = (product) => {
    setSelectedProduct(product);
    setForm({ ...form, product: product.name });
  };

  const submitOrder = async () => {
    if (!form.customerName || !form.phone || !form.product) {
      alert("❌ Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/orders", form);
      console.log("Order response:", response); // Debug log
      alert("✅ Order placed successfully! We'll contact you soon.");
      setForm({ customerName: "", phone: "", quantity: 1, product: "" });
      setSelectedProduct(null);
    } catch (err) {
      console.error("Order error:", err); // Debug log
      alert(`❌ Order failed: ${err.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const closeOrderForm = () => {
    setSelectedProduct(null);
    setForm({ customerName: "", phone: "", quantity: 1, product: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">🍄 Premium Mushroom Products</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Discover our range of fresh, organic oyster mushrooms and mushroom-based products.
            Sustainably grown with traditional farming methods for exceptional quality.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              {/* Product Image */}
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
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

                {/* Order Button */}
                <button
                  onClick={() => orderNow(product)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🛒 Order Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Assurance Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🌱 Our Quality Promise</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every product is carefully cultivated using sustainable farming practices,
              ensuring the highest quality and nutritional value for our customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Organic Farming</h3>
              <p className="text-gray-600">Grown without harmful chemicals or pesticides</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Fresh Harvest</h3>
              <p className="text-gray-600">Harvested daily and delivered fresh to your door</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Quality</h3>
              <p className="text-gray-600">Rigorous quality checks ensure only the best products</p>
            </div>
          </div>
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
                    "✅ Confirm Order"
                  )}
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
