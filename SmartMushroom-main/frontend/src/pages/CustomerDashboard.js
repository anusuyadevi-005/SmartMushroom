import { useState, useEffect } from "react";
import api from "../services/api";
import { 
    FiPackage, 
    FiShoppingCart, 
    FiBell, 
    FiCheckCircle, 
    FiTruck, 
    FiStar,
    FiPlus,
    FiMinus
} from "react-icons/fi";
import { BiCartAdd } from "react-icons/bi";

/* ── helpers ── */
function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
    } catch {
        return {};
    }
}

function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── status maps (keyed to backend values PENDING/PACKED/SHIPPED/DELIVERED) ── */
const STATUS_MAP = {
    PENDING:   { bg: "#fff8e1", color: "#f57c00", dot: "#ffa726", label: "Order Received", step: 0 },
    PACKED:    { bg: "#e3f2fd", color: "#1565c0", dot: "#42a5f5", label: "Being Packed",   step: 1 },
    SHIPPED:   { bg: "#f3e5f5", color: "#6a1b9a", dot: "#ab47bc", label: "On the Way",     step: 2 },
    DELIVERED: { bg: "#e8f5e9", color: "#1b5e20", dot: "#4caf50", label: "Delivered",      step: 3 },
};
const STEPS = ["PENDING", "PACKED", "SHIPPED", "DELIVERED"];
const STEP_LABELS = ["Received", "Packing", "Shipped", "Done"];

function StatusBadge({ status }) {
    const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
    return (
        <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block", animation: status !== "DELIVERED" ? "blink 1.5s infinite" : "none" }} />
            {s.label}
        </span>
    );
}

function Stepper({ status }) {
    const idx = STEPS.indexOf(status);
    return (
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 14 }}>
            {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        {i > 0 && <div style={{ flex: 1, height: 3, background: i <= idx ? "#2d6a4f" : "#e0e0e0", transition: "background 0.5s" }} />}
                        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: i < idx ? "#2d6a4f" : i === idx ? "#fff" : "#f0f0f0", border: i === idx ? "3px solid #2d6a4f" : i < idx ? "3px solid #2d6a4f" : "3px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: i < idx ? "#fff" : i === idx ? "#2d6a4f" : "#bbb", fontWeight: 700 }}>
                            {i < idx ? <FiCheckCircle /> : i === idx ? "●" : ""}
                        </div>
                        {i < STEPS.length - 1 && <div style={{ flex: 1, height: 3, background: i < idx ? "#2d6a4f" : "#e0e0e0", transition: "background 0.5s" }} />}
                    </div>
                    <div style={{ fontSize: 9, marginTop: 4, color: i <= idx ? "#2d6a4f" : "#bbb", fontWeight: i === idx ? 700 : 400, textAlign: "center" }}>
                        {STEP_LABELS[i]}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CustomerDashboard() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [qty, setQty] = useState({});
    const [toast, setToast] = useState(null);
    const [reviewModal, setReviewModal] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [user, setUser] = useState({ name: "", email: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const payload = decodeToken(token);
            const identity = payload.sub || payload;
            const email = typeof identity === "object" ? (identity.email || "") : (typeof identity === "string" ? identity : "");
            const name = typeof identity === "object" ? (identity.name || email.split("@")[0] || "User") : (email.split("@")[0] || "User");
            setUser({ name, email });
        }
    }, []);

    useEffect(() => {
        async function fetchData() {
            setLoadingOrders(true);
            setLoadingProducts(true);
            try {
                const [ordersRes, productsRes] = await Promise.all([
                    api.get("/orders/my"),
                    api.get("/products")
                ]);
                setOrders(ordersRes.data || []);
                setProducts(productsRes.data || []);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoadingOrders(false);
                setLoadingProducts(false);
            }
        }
        fetchData();
    }, []);

    const activeOrders = orders.filter(o => o.status !== "DELIVERED");
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
    const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function placeOrder(product) {
        const q = qty[product.id] || 1;
        if (placingOrder) return;

        const token = localStorage.getItem("token");
        if (!token) { showToast("Please log in to place an order", "error"); return; }

        setPlacingOrder(true);
        try {
            const orderData = {
                email: user.email,
                customerName: user.name || user.email,
                phone: "",
                items: [{ product: `${product.name} (${product.unit || ""})`, quantity: q, price: product.price }],
                totalAmount: product.price * q,
                shippingAddress: { line1: "", city: "", state: "", pincode: "" },
            };
            const res = await api.post("/orders/", orderData);
            showToast(`Order #${res.data.orderNo} placed! 🎉`);
            const updated = await api.get("/orders/my");
            setOrders(updated.data || []);
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to place order", "error");
        } finally {
            setPlacingOrder(false);
        }
    }

    function orderProductName(o) {
        if (o.items && o.items.length > 0) {
            return o.items.map(i => `${i.product || ""}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ");
        }
        return o.product || "Mushroom Order";
    }

    function orderDate(o) {
        if (!o.createdAt) return "—";
        return new Date(o.createdAt).toLocaleDateString("en-IN");
    }

    return (
        <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f7f9f7", color: "#1a1a1a", paddingBottom: 40 }}>
            <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        .hov { transition: all 0.2s; cursor: pointer; }
        .hov:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(45,106,79,0.14) !important; }
        .product-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease; }
        .product-card:hover { transform: translateY(-5px); }
        .product-image { width: 100%; height: 200px; object-fit: cover; }
        .feature-badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; borderRadius: 4px; fontSize: 10px; fontWeight: 600; marginRight: 4px; marginBottom: 4px; display: inline-block; }
      `}</style>

            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.type === "error" ? "#c62828" : "#2d6a4f", color: "#fff", padding: "12px 24px", borderRadius: 30, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideDown 0.3s ease", fontSize: 14, fontWeight: 600 }}>
                    {toast.type === "error" ? "⚠️" : <FiCheckCircle style={{ marginRight: 8 }} />} {toast.msg}
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setReviewModal(null)}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 320 }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>Rate Your Order</div>
                        <div style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>{orderProductName(reviewModal)}</div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
                            {[1, 2, 3, 4, 5].map(s => <span key={s} onClick={() => setRating(s)} style={{ fontSize: 32, cursor: "pointer", color: s <= rating ? "#ffc107" : "#ddd" }}><FiStar fill={s <= rating ? "#ffc107" : "none"} /></span>)}
                        </div>
                        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." style={{ width: "100%", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: 10, fontSize: 13, height: 80, outline: "none" }} />
                        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                            <button onClick={() => setReviewModal(null)} style={{ flex: 1, border: "1.5px solid #e0e0e0", background: "#fff", borderRadius: 10, padding: 10, cursor: "pointer" }}>Cancel</button>
                            <button onClick={() => { showToast("Thank you for your review! ⭐"); setReviewModal(null); setRating(0); setReviewText(""); }} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 10, padding: 10, cursor: "pointer", fontWeight: 700 }}>Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div style={{ maxWidth: 860, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
                <div style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #40916c 100%)", padding: "32px 20px 40px", borderRadius: "0 0 32px 32px", boxShadow: "0 10px 30px rgba(45,106,79,0.15)" }}>
                    <div style={{ fontSize: 14, color: "#95d5b2", marginBottom: 2 }}>Welcome back 👋</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                        Hello, {user.name}!
                    </div>
                    <div style={{ fontSize: 14, color: "#b7e4c7", marginBottom: 24 }}>Your farm-to-table mushroom summary</div>
                    
                    <div style={{ display: "flex", gap: 12 }}>
                        {[
                            { label: "Total Orders", value: loadingOrders ? "…" : orders.length },
                            { label: "Active",       value: loadingOrders ? "…" : activeOrders.length },
                            { label: "Total Spent",  value: loadingOrders ? "…" : `₹${totalSpent.toLocaleString()}` },
                        ].map(s => (
                            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "16px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: "#95d5b2", fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
                    
                    {/* Latest Active Order Tracking */}
                    {activeOrders.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 17, color: "#1b4332", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <FiTruck /> Track Your Order
                            </div>
                            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #edf2ed" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0faf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#2d6a4f" }}>
                                            <FiPackage />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>{orderProductName(activeOrders[0])}</div>
                                            <div style={{ fontSize: 12, color: "#999" }}>Order #{activeOrders[0].orderNo} · {orderDate(activeOrders[0])}</div>
                                        </div>
                                    </div>
                                    <StatusBadge status={activeOrders[0].status} />
                                </div>
                                <Stepper status={activeOrders[0].status} />
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 13, color: "#666" }}>
                                        Amount to pay: <span style={{ fontWeight: 700, color: "#2d6a4f", fontSize: 15 }}>₹{activeOrders[0].totalAmount}</span>
                                    </div>
                                    <a href="/myorders" style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 700, textDecoration: "none" }}>View All Orders →</a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Fresh Now (Quick Shop) */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 17, color: "#1b4332", display: "flex", alignItems: "center", gap: 8 }}>
                                <FiShoppingCart /> Order Fresh Today
                            </div>
                            <a href="/products" style={{ fontSize: 14, color: "#2d6a4f", fontWeight: 700, textDecoration: "none" }}>See Shop →</a>
                        </div>
                        
                        {loadingProducts ? (
                            <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Loading products…</div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {products.slice(0, 4).map((p) => (
                                    <div key={p.id} className="product-card">
                                        <div style={{ position: "relative" }}>
                                            <img src={Array.isArray(p.image) ? p.image[0] : p.image} alt={p.name} className="product-image" style={{ height: 140 }} />
                                            <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", padding: "4px 8px", borderRadius: 8, fontWeight: 700, fontSize: 12, color: "#1b4332", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                                                ₹{p.discount > 0 ? Math.round(p.price * (1 - p.discount/100)) : p.price}
                                            </div>
                                            {p.discount > 0 && (
                                                <div style={{ position: "absolute", top: 8, left: 8, background: "linear-gradient(to right, #ef4444, #ec4899)", color: "#fff", padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 900, boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)" }}>
                                                    {p.discount}% OFF
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: "12px" }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                                            {p.discount > 0 && (
                                                <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4, textDecoration: "line-through" }}>
                                                    Original: ₹{p.price}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 11, color: "#888", marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {p.features && p.features.slice(0, 2).map((f, i) => (
                                                    <span key={i} className="feature-badge" style={{ margin: 0 }}>{f}</span>
                                                ))}
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #eef4ee", borderRadius: 12, overflow: "hidden", background: "#f9fbf9" }}>
                                                    <button onClick={() => setQty(q => ({ ...q, [p.id]: Math.max(1, (q[p.id] || 1) - 1) }))} style={{ border: "none", background: "none", width: 28, height: 28, cursor: "pointer", color: "#2d6a4f" }}><FiMinus /></button>
                                                    <span style={{ width: 24, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{qty[p.id] || 1}</span>
                                                    <button onClick={() => setQty(q => ({ ...q, [p.id]: (q[p.id] || 1) + 1 }))} style={{ border: "none", background: "none", width: 28, height: 28, cursor: "pointer", color: "#2d6a4f" }}><FiPlus /></button>
                                                </div>
                                                <button 
                                                    onClick={() => placeOrder(p)} 
                                                    disabled={placingOrder}
                                                    style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, cursor: "pointer", opacity: placingOrder ? 0.7 : 1 }}
                                                >
                                                    <BiCartAdd size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Deliveries Mini-list */}
                    {!loadingOrders && deliveredOrders.length > 0 && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 17, color: "#1b4332", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <FiCheckCircle /> Recent Deliveries
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {deliveredOrders.slice(0, 3).map(o => (
                                    <div key={o.orderNo} style={{ background: "#fff", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0faf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#2d6a4f" }}>
                                            <FiPackage />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{orderProductName(o)}</div>
                                            <div style={{ fontSize: 11, color: "#999" }}>Delivered {orderDate(o)} · ₹{o.totalAmount}</div>
                                        </div>
                                        <button 
                                            onClick={() => setReviewModal(o)}
                                            style={{ color: "#f59e0b", background: "#fff9eb", border: "1px solid #fee2b3", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                        >
                                            <FiStar /> Rate
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
