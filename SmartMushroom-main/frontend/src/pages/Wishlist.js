import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Heart, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchWishlist();
    }, [navigate]);

    const fetchWishlist = async () => {
        try {
            const res = await api.get("/wishlist");
            setWishlist(res.data);
        } catch (err) {
            console.error("Error fetching wishlist:", err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await api.post("/wishlist/remove", { productId });
            setWishlist(wishlist.filter((item) => item.id !== productId));
        } catch (err) {
            alert("Failed to remove item");
        }
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = cart.find((item) => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
        alert(`${product.name} added to cart!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-12 h-12 text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-8">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    <h1 className="text-3xl font-bold text-gray-800">My Wishlist</h1>
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-xl text-gray-500 mb-6">Your wishlist is empty</p>
                        <button
                            onClick={() => navigate("/products")}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {wishlist.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <img
                                    src={Array.isArray(product.image) ? product.image[0] : product.image}
                                    alt={product.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-emerald-600 font-bold text-2xl mb-4">
                                        ₹{product.price}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                                        </button>
                                        <button
                                            onClick={() => removeFromWishlist(product.id)}
                                            className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
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

export default Wishlist;
