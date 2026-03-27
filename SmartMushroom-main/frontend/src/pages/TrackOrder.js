import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import {
  FiSearch,
  FiPackage,
  FiCheckCircle,
  FiTruck,
  FiHome,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiPhone,
  FiHash
} from "react-icons/fi";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "SHIPPED", "DELIVERED"];

const getStatusIndex = (status) => {
  const s = status?.toUpperCase() || "PENDING";
  if (s === "CONFIRMED") return 1;
  if (s === "PROCESSING") return 1;
  if (s === "PACKED") return 2;
  if (s === "COMPLETED") return 3;
  
  const idx = STATUS_STEPS.indexOf(s);
  return idx === -1 ? 0 : idx;
};

const getStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return <FiPackage />;
    case "ACCEPTED": 
    case "CONFIRMED":
    case "PROCESSING":
      return <FiCheckCircle />;
    case "SHIPPED": 
    case "PACKED":
      return <FiTruck />;
    case "DELIVERED": 
    case "COMPLETED":
      return <FiHome />;
    default: return <FiPackage />;
  }
};

function TrackOrder() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  // Handle URL parameters (e.g., /track?orderNo=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderNo = params.get("orderNo");
    if (orderNo) {
      setQuery(orderNo);
      track(orderNo);
    }
  }, [location]);

  const track = async (searchVal = query) => {
    if (!searchVal) {
      setError("Please enter a phone number or order number");
      setOrders([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      let res;
      // If it looks like a phone number (10 digits), prefer phone tracking
      // Otherwise try tracking by order number endpoint
      if (searchVal.length >= 10 && /^\d+$/.test(searchVal)) {
        res = await api.get(`/orders/track/${searchVal}`);
      } else {
        // Try direct order no tracking
        try {
          res = await api.get(`/orders/track/order/${searchVal}`);
        } catch (err) {
          // Fallback to general track if direct fails (e.g. if orderNo is also numeric string)
          res = await api.get(`/orders/track/${searchVal}`);
        }
      }

      setOrders(res.data);
      if (res.data.length === 0) {
        setError(`No orders found for "${searchVal}"`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch order tracking information");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      track();
    }
  };

  return (
    <div className="track-order-container" style={{
      minHeight: "100vh",
      padding: "0 0 60px",
      background: "#f9fafb", // gray-50
      color: "#111827",
      fontFamily: "'Inter', 'Outfit', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        .header-section {
          background: #065f46; /* emerald-800 */
          color: white;
          padding: 60px 20px 100px;
          text-align: center;
        }

        .content-wrapper {
          max-width: 1000px;
          margin: -60px auto 0;
          padding: 0 20px;
        }

        .premium-card {
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
          margin-bottom: 30px;
        }

        .search-container {
          display: flex;
          gap: 15px;
          background: white;
          padding: 10px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(6, 95, 70, 0.1);
          margin-bottom: 40px;
        }

        .search-input {
          flex: 1;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 15px 25px;
          color: #111827;
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #059669; /* emerald-600 */
          background: white;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
        }

        .track-btn {
          background: #059669; /* emerald-600 */
          color: white;
          border: none;
          padding: 0 40px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .track-btn:hover {
          background: #047857; /* emerald-700 */
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.2);
        }

        .status-stepper {
          display: flex;
          justify-content: space-between;
          margin: 50px 0;
          position: relative;
        }

        .status-stepper::before {
          content: '';
          position: absolute;
          top: 25px;
          left: 5%;
          right: 5%;
          height: 3px;
          background: #e5e7eb;
          z-index: 1;
        }

        .progress-line {
          position: absolute;
          top: 25px;
          left: 5%;
          height: 3px;
          background: #059669;
          z-index: 2;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100px;
        }

        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          border: 3px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #9ca3af;
          transition: all 0.5s ease;
        }

        .step.active .step-icon {
          background: #ecfdf5;
          border-color: #059669;
          color: #059669;
          box-shadow: 0 0 20px rgba(5, 150, 105, 0.2);
          animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(5, 150, 105, 0); }
          100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }

        .step.completed .step-icon {
          background: #059669;
          border-color: #059669;
          color: white;
          transform: scale(1.1);
        }

        .step-label {
          font-size: 13px;
          font-weight: 700;
          color: #9ca3af;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .step.active .step-label, .step.completed .step-label {
          color: #065f46;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px border-style: solid; border-color: #f3f4f6;
          padding-bottom: 25px;
        }

        .order-id {
          font-size: 24px;
          font-weight: 800;
          color: #065f46;
        }

        .order-date {
          font-size: 15px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 5px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 30px;
          background: #f9fafb;
          padding: 25px;
          border-radius: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #9ca3af;
          font-weight: 700;
        }

        .detail-value {
          font-size: 16px;
          color: #111827;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .items-list {
          margin-top: 30px;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }

        .product-item:last-child {
          border-bottom: none;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #9ca3af;
        }

        .loader {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-bottom-color: #059669;
          border-radius: 50%;
          display: inline-block;
          animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="header-section">
        <h1 style={{ fontSize: "3rem", fontWeight: "900", marginBottom: "15px" }}>Track Your Goodness</h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>Real-time updates on your organic mushroom delivery.</p>
      </div>

      <div className="content-wrapper">
        <div className="search-container">
          <input
            className="search-input"
            placeholder="Phone (e.g., 9876543210) OR Order # (e.g., 101)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="track-btn" onClick={() => track()} disabled={loading}>
            {loading ? "Searching..." : <><FiSearch size={20} /> TRACK</>}
          </button>
        </div>

        {error && (
          <div style={{
            padding: "20px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#b91c1c",
            borderRadius: "16px",
            textAlign: "center",
            marginBottom: "30px",
            fontWeight: "600"
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <span className="loader"></span>
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="empty-state">
            <FiPackage style={{ fontSize: "80px", opacity: 0.3, marginBottom: "25px" }} />
            <h3 style={{ fontSize: "20px", fontWeight: "600" }}>Enter details to track your package</h3>
          </div>
        )}

        <div className="orders-container">
          {orders.map((order, idx) => {
            const statusIdx = getStatusIndex(order.status);
            const progressWidth = (statusIdx / (STATUS_STEPS.length - 1)) * 90;

            return (
              <div key={idx} className="premium-card">
                <div className="order-header">
                  <div>
                    <div className="order-id">Order ID: #{order.orderNo || "N/A"}</div>
                    <div className="order-date">
                      <FiCalendar /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      }) : "Date Unknown"}
                    </div>
                  </div>
                  <div style={{
                    background: statusIdx === 3 ? "#ecfdf5" : "#f0fdf4",
                    color: statusIdx === 3 ? "#059669" : "#047857",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    border: `1px solid ${statusIdx === 3 ? "#10b981" : "#34d399"}40`
                  }}>
                    {order.status}
                  </div>
                </div>

                <div className="status-stepper">
                  <div className="progress-line" style={{ width: `${progressWidth}%` }}></div>
                  {STATUS_STEPS.map((step, i) => (
                    <div
                      key={step}
                      className={`step ${i <= statusIdx ? 'active' : ''} ${i < statusIdx ? 'completed' : ''}`}
                    >
                      <div className="step-icon">
                        {i < statusIdx ? <FiCheckCircle /> : getStatusIcon(step)}
                      </div>
                      <div className="step-label">{step}</div>
                    </div>
                  ))}
                </div>

                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Customer</span>
                    <span className="detail-value"><FiUser size={18} /> {order.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Shipping To</span>
                    <span className="detail-value">
                      <FiMapPin size={18} />
                      {order.shippingAddress?.address || "Address details pending"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact</span>
                    <span className="detail-value"><FiPhone size={18} /> {order.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tracking ID</span>
                    <span className="detail-value"><FiHash size={18} /> {order.orderNo || "Generated on Ship"}</span>
                  </div>
                </div>

                <div className="items-list">
                  <h4 style={{
                    marginBottom: "20px",
                    fontSize: "12px",
                    color: "#9ca3af",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>ORDERED ITEMS</h4>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <div key={i} className="product-item">
                        <span style={{ fontWeight: "600" }}>{item.name || item.product} <span style={{ color: "#9ca3af", fontWeight: "400" }}>x {item.quantity}</span></span>
                        <span style={{ fontWeight: "700" }}>₹{item.price * item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <div className="product-item">
                      <span style={{ fontWeight: "600" }}>{order.product} <span style={{ color: "#9ca3af", fontWeight: "400" }}>x {order.quantity}</span></span>
                      <span style={{ fontWeight: "700" }}>₹{order.totalAmount}</span>
                    </div>
                  )}
                  <div style={{
                    marginTop: "30px",
                    paddingTop: "20px",
                    borderTop: "2px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "800",
                    fontSize: "20px"
                  }}>
                    <span style={{ color: "#374151" }}>Total Amount</span>
                    <span style={{ color: "#059669" }}>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TrackOrder;
