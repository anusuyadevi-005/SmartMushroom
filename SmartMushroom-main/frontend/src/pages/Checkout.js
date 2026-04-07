import React, { useState, useEffect } from "react";
import api from "../services/api";
import { CheckCircle, Truck, CreditCard, ChevronRight, Package, Loader2, ShieldCheck } from "lucide-react";
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

    const handlePlaceOrder = async (razorResponse) => {
        setLoading(true);
        try {
            const payload = {
                customerName: address.fullName,
                phone: address.phone,
                items: cart,
                totalAmount: subtotal,
                shippingAddress: address,
                paymentId: razorResponse.razorpay_payment_id
            };

            const res = await api.post("/orders", payload);
            setOrderNo(res.data.orderNo);
            clearCart();
            setStep(3);
        } catch (err) {
            console.error("Order creation failed:", err);
            alert("Order placement failed after payment! Backend is down.");
        } finally {
            setLoading(false);
        }
    };

    const handleRazorPay = async () => {
        setLoading(true);
        try {
            // 1. Create Order ID via backend
            const orderRes = await api.post("/payments/create-order", { amount: subtotal });
            const { orderId, key, amount, currency } = orderRes.data;

            // 2. Official Razorpay Options
            const options = {
                key: key, 
                amount: amount,
                currency: currency,
                name: "Smart Mushroom",
                description: "Purchase Mushroom Products",
                image: "https://cdn-icons-png.flaticon.com/512/3571/3571572.png",
                order_id: orderId,
                handler: async function (response) {
                    await handlePlaceOrder(response);
                },
                prefill: {
                    name: address.fullName,
                    contact: address.phone,
                    email: "test@example.com"
                },
                theme: {
                    color: "#059669" // Emerald-600
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert("Payment Failed: " + response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (error) {
            console.error("Razorpay error:", error);
            const errorMsg = error.response?.data?.error || error.message || "Unknown error";
            alert(`Razorpay API failed to open: ${errorMsg}. Check your RAZORPAY_KEY_ID in backend/.env.`);
            setLoading(false);
        }
    };

    const renderStepIcon = (stepNum, Icon) => (
        <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${step >= stepNum ? "bg-emerald-600 text-white shadow-lg" : "bg-gray-200 text-gray-400"}`}>
            <Icon className="w-5 h-5" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-16 relative px-4 max-w-xl mx-auto">
                    <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-10"></div>
                    <div className="flex flex-col items-center gap-2">{renderStepIcon(1, Truck)}<span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Address</span></div>
                    <div className="flex flex-col items-center gap-2">{renderStepIcon(2, CreditCard)}<span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Payment</span></div>
                    <div className="flex flex-col items-center gap-2">{renderStepIcon(3, Package)}<span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Success</span></div>
                </div>

                {step === 1 && (
                    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 p-8 md:p-12">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-8 italic">Shipping Data</h1>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <input type="text" placeholder="Your Name" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                                <input type="tel" placeholder="Mobile" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                            </div>
                            <input type="text" placeholder="House No, Street, Landmark" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <input type="text" placeholder="City" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                                <input type="text" placeholder="State" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                                <input type="text" placeholder="Zip" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold shadow-sm" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
                            </div>
                            <button disabled={!address.fullName || !address.phone || !address.street} onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white py-5 rounded-[1.2rem] font-black text-xl hover:shadow-2xl transition-all disabled:opacity-20 translate-y-0 active:scale-95 shadow-emerald-100 uppercase tracking-widest">Go to Review</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white rounded-[2rem] shadow-xl p-10 border border-gray-100">
                                <h2 className="text-xl font-black mb-8 italic flex items-center gap-2 uppercase tracking-widest text-[#1e293b]">Confirm Cart</h2>
                                <div className="space-y-6">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex gap-6 items-center">
                                            <img src={Array.isArray(item.image) ? item.image[0] : item.image} className="w-20 h-20 rounded-[1.2rem] object-cover shadow-sm bg-gray-50 border" alt="" />
                                            <div className="flex-1">
                                                <h4 className="font-black text-gray-900 leading-tight">{item.name}</h4>
                                                <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest text-[10px]">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="font-black text-xl text-gray-900">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-emerald-600 rounded-[2.5rem] shadow-2xl p-10 text-white h-fit sticky top-24">
                                <h2 className="text-2xl font-black mb-10 tracking-tighter opacity-80 uppercase tracking-widest">Final Price</h2>
                                <div className="space-y-4 mb-10 font-bold opacity-80 uppercase text-[10px] tracking-[0.2em] leading-none">
                                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                                    <div className="flex justify-between"><span>Delivery</span><span className="text-emerald-300">FREE</span></div>
                                    <div className="border-t border-white/20 pt-8 flex justify-between font-black text-5xl tracking-normal text-white opacity-100 normal-case leading-none"><span>Total</span><span>₹{subtotal}</span></div>
                                </div>
                                <button disabled={loading} onClick={handleRazorPay} className="w-full bg-white text-emerald-600 py-6 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-2xl">
                                    {loading ? <Loader2 className="animate-spin" /> : "PAY WITH RAZORPAY"}
                                </button>
                                <div className="mt-8 flex items-center justify-center gap-2 text-[10px] opacity-40 font-black tracking-widest uppercase"><ShieldCheck className="w-4 h-4" /> Razorpay Secured Only</div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white rounded-[3rem] shadow-2xl p-20 text-center border border-gray-100 animate-in fade-in zoom-in duration-700">
                        <div className="w-28 h-28 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-10 text-emerald-600 shadow-xl shadow-emerald-50"><CheckCircle className="w-14 h-14" /></div>
                        <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight tracking-tighter italic">Payment Successful!</h1>
                        <p className="text-gray-400 text-xl font-medium mb-12 max-w-sm mx-auto leading-relaxed underline decoration-emerald-100 decoration-4 underline-offset-8">Order <span className="font-black text-emerald-600 ">#{orderNo}</span> is confirmed. Receipt sent to email.</p>
                        <div className="flex flex-col md:flex-row gap-5 justify-center pt-8">
                            <button onClick={() => navigate("/myorders")} className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black transition-all hover:bg-black shadow-lg">VIEW ORDERS</button>
                            <button onClick={() => navigate("/products")} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-200">SHOP AGAIN</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Checkout;
