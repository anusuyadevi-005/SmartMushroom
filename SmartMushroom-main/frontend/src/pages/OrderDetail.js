import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    ArrowLeft,
    MapPin,
    CreditCard,
    Package,
    Calendar,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    Download,
    ShieldCheck,
    HelpCircle,
    ChevronRight,
    RefreshCcw
} from "lucide-react";

function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const res = await api.get(`/orders/${orderId}`);
                setOrder(res.data);
            } catch (err) {
                console.error("Failed to fetch order details:", err);
                setError(err.response?.data?.error || "Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetail();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Error Loading Order</h2>
                <p className="text-gray-600 mt-2 mb-8">{error || "Order not found."}</p>
                <button
                    onClick={() => navigate("/myorders")}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold"
                >
                    Back to My Orders
                </button>
            </div>
        );
    }

    const getStatusSteps = (status) => {
        const steps = [
            { id: 'PENDING', label: 'Ordered', icon: <Clock className="w-5 h-5" /> },
            { id: 'ACCEPTED', label: 'Accepted', icon: <CheckCircle2 className="w-5 h-5" /> },
            { id: 'PACKED', label: 'Packed', icon: <Package className="w-5 h-5" /> },
            { id: 'SHIPPED', label: 'Shipped', icon: <Truck className="w-5 h-5" /> },
            { id: 'DELIVERED', label: 'Delivered', icon: <ShieldCheck className="w-5 h-5" /> }
        ];

        let activeIndex = steps.findIndex(s => s.id === status);
        if (status === "CONFIRMED") activeIndex = 1;
        if (status === "PROCESSING") activeIndex = 2;

        if (activeIndex === -1 && status === "CANCELLED") return []; // Special case
        if (activeIndex === -1) activeIndex = 0; // Default to first

        return steps.map((step, index) => ({
            ...step,
            completed: index <= activeIndex,
            active: index === activeIndex
        }));
    };

    const statusSteps = getStatusSteps(order.status);
    const isCancelled = order.status === "CANCELLED";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Breadcrumb Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/myorders" className="hover:text-emerald-700 transition-colors">Your Orders</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Order Details</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Order Details</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                            <span>Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="hidden sm:inline">|</span>
                            <span>Order # {order.orderNo || order._id.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                            <Download className="w-4 h-4" /> Invoice
                        </button>
                        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-all">
                            Buy it Again
                        </button>
                    </div>
                </div>

                {/* Amazon-style Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white mb-10 shadow-sm">
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <p className="font-bold text-gray-800">{order.shippingAddress?.name || order.customerName}</p>
                            <p>{order.shippingAddress?.address || "No address provided"}</p>
                            <p>Phone: {order.shippingAddress?.phone || order.phone}</p>
                        </div>
                    </div>
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Payment Method</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="bg-gray-100 p-2 rounded">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Online Payment</p>
                                <p className="text-xs text-gray-400">Transaction ID: TXN{order._id.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Items:</span>
                                <span>₹{order.totalAmount || 0}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Shipping:</span>
                                <span className="text-emerald-600 font-medium">FREE</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Total Tax:</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                                <span>Grand Total:</span>
                                <span className="text-emerald-700">₹{order.totalAmount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking Timeline */}
                {!isCancelled && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 mb-10 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
                            <Truck className="w-6 h-6 text-emerald-600" /> Shipment Status
                        </h3>
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 hidden sm:block"></div>

                            <div className="relative flex flex-col sm:flex-row justify-between gap-8 sm:gap-0">
                                {statusSteps.map((step, idx) => (
                                    <div key={idx} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-4 flex-1 z-10">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${step.completed ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-2 border-gray-200 text-gray-300'
                                            }`}>
                                            {step.icon}
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <p className={`text-sm font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                            {step.active && <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest mt-0.5">Current Status</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isCancelled && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-10 flex items-center gap-4">
                        <XCircle className="w-10 h-10 text-red-500" />
                        <div>
                            <h3 className="text-lg font-bold text-red-800">Order Cancelled</h3>
                            <p className="text-red-600 text-sm">This order was cancelled. No payment was captured.</p>
                        </div>
                    </div>
                )}

                {/* Items List */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-900">
                        Order Items
                    </div>
                    <div className="divide-y divide-gray-100">
                        {(order.items || [{ product: order.product, quantity: order.quantity, price: order.price }]).map((item, idx) => (
                            <div key={idx} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                    <img
                                        src={item.image || "https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=200&h=200&fit=crop"}
                                        alt={item.product || item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-emerald-800 hover:underline cursor-pointer">{item.product || item.name}</h4>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                                        <span className="text-gray-500 font-medium">Quantity: <span className="text-gray-900 font-bold">{item.quantity}</span></span>
                                        <span className="text-gray-500 font-medium">Price: <span className="text-gray-900 font-bold">₹{item.price || 0}</span></span>
                                    </div>
                                    <div className="flex gap-4 mt-4 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Guarantee</span>
                                        <span className="flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Returnable</span>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex flex-row sm:flex-col gap-2">
                                    <button className="flex-1 sm:w-40 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-bold shadow-md transition-all">Buy it Again</button>
                                    <button className="flex-1 sm:w-40 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">Write a Review</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Support Section */}
                <div className="mt-12 text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <HelpCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-emerald-900">Need help with this order?</h3>
                    <p className="text-emerald-700 text-sm mt-1 mb-6">Our support team is available 24/7 for any questions regarding your delivery.</p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-emerald-600 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">Contact Support</button>
                        <button className="bg-white text-emerald-700 border border-emerald-200 px-8 py-2.5 rounded-full font-bold hover:bg-emerald-50 transition-all">Help Center</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;
