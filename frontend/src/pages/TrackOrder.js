import React, { useState } from "react";
import api from "../services/api";

function TrackOrder() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);

  const track = () => {
    api.get(`/orders/track/${phone}`)
      .then(res => setOrders(res.data))
      .catch(err => console.log(err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Track Your Order</h2>

      <input
        placeholder="Enter Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button onClick={track}>Track</button>

      {orders.length > 0 && (
        <table border="1" cellPadding="10" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i}>
                <td>{o.product}</td>
                <td>{o.quantity}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrackOrder;
