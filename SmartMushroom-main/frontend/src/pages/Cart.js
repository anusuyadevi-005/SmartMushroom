import React, { useState, useEffect } from "react";
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCart, saveCart } from "../services/cartService";

function Cart() {
    const [cart, setCart] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        setCart(getCart());
    }, [navigate]);

    const updateQuantity = (id, delta) => {
        const newCart = cart.map((item) => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        });
        setCart(newCart);
        saveCart(newCart);
    };

    const removeItem = (id) => {
        const newCart = cart.filter((item) => item.id !== id);
        setCart(newCart);
        saveCart(newCart);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingCart className="w-8 h-8 text-emerald-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
                </div>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                        <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
                        <button
                            onClick={() => navigate("/products")}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Go to Store
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6"
                                >
                                    <img
                                        src={Array.isArray(item.image) ? item.image[0] : item.image}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                        <p className="text-emerald-600 font-bold">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-bold">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-fit">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">FREE</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-xl text-gray-800">
                                    <span>Total</span>
                                    <span>₹{subtotal}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate("/checkout")}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-200"
                            >
                                Checkout <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;
