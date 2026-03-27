import React, { useState, useEffect } from "react";
import api from "../services/api";
import { CheckCircle, Truck, CreditCard, ChevronRight, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../services/cartService";

function Checkout() {
    const [step, setStep] = useState(1);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderNo, setOrderNo] = useState(null);
    const navigate = useNavigate();

    const [address, setAddress] = useState({
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zip: ""
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login?redirect=checkout");
            return;
        }
        const savedCart = getCart();
        if (savedCart.length === 0) {
            navigate("/products");
        }
        setCart(savedCart);
    }, [navigate]);

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                customerName: address.fullName,
                phone: address.phone,
                items: cart,
                totalAmount: subtotal,
                shippingAddress: address
            };

            const res = await api.post("/orders", payload);
            setOrderNo(res.data.orderNo);
            clearCart();
            setStep(3);
        } catch (err) {
            console.error("Checkout error deep dive:", err.response?.data || err);
            const errorMsg = err.response?.data?.error || "Failed to place order.";
            const details = err.response?.data?.details ? `\nDetails: ${err.response.data.details}` : "";
            const message = err.response?.data?.message ? `\nMessage: ${err.response.data.message}` : "";
            alert(`${errorMsg}${details}${message}\nPlease check the console for more trace info.\nPlease try again.`);
        } finally {
            setLoading(false);
        }
    };

    const renderStepIcon = (stepNum, Icon) => (
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= stepNum ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>
            <Icon className="w-5 h-5" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Progress Stepper */}
                <div className="flex items-center justify-between mb-12 relative px-4">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10 mx-12"></div>
                    <div className="flex flex-col items-center gap-2">
                        {renderStepIcon(1, Truck)}
                        <span className="text-xs font-bold text-gray-600">Shipping</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        {renderStepIcon(2, CheckCircle)}
                        <span className="text-xs font-bold text-gray-600">Review</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        {renderStepIcon(3, Package)}
                        <span className="text-xs font-bold text-gray-600">Confirmation</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                            <h1 className="text-2xl font-bold text-gray-800">Shipping Details</h1>
                            <p className="text-gray-500">Where should we send your mushrooms?</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                    value={address.fullName}
                                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                    value={address.phone}
                                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Street Address"
                                className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                value={address.street}
                                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="City"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                    value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Zip"
                                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                                    value={address.zip}
                                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                                />
                            </div>
                            <button
                                disabled={!address.fullName || !address.phone || !address.street}
                                onClick={() => setStep(2)}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                Continue to Review
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        <div className="md:col-span-3 space-y-6">
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Package className="w-5 h-5" /> Review Items
                                </h2>
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center">
                                            <img src={Array.isArray(item.image) ? item.image[0] : item.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{item.name}</h4>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-bold">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-600">
                                    <Truck className="w-5 h-5" /> Shipping To
                                </h2>
                                <div className="text-gray-600 leading-relaxed">
                                    <p className="font-bold text-gray-800">{address.fullName}</p>
                                    <p>{address.street}</p>
                                    <p>{address.city}, {address.state} {address.zip}</p>
                                    <p>{address.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="bg-emerald-600 rounded-3xl shadow-xl p-8 text-white h-fit sticky top-24">
                                <h2 className="text-xl font-bold mb-6">Payment Summary</h2>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between opacity-80">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between opacity-80">
                                        <span>Shipping</span>
                                        <span>FREE</span>
                                    </div>
                                    <div className="border-t border-white/20 pt-4 flex justify-between font-bold text-2xl">
                                        <span>Total</span>
                                        <span>₹{subtotal}</span>
                                    </div>
                                </div>
                                <button
                                    disabled={loading}
                                    onClick={handlePlaceOrder}
                                    className="w-full bg-white text-emerald-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "Place Order Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-800 mb-4">Order Confirmed!</h1>
                        <p className="text-gray-500 text-lg mb-8">
                            Thank you for your purchase. Your order <span className="font-bold text-emerald-600">#{orderNo}</span> is being prepared and will be delivered soon.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate("/myorders")}
                                className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all"
                            >
                                Track My Order
                            </button>
                            <button
                                onClick={() => navigate("/products")}
                                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Checkout;
