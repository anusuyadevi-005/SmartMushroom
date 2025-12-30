import React, { useEffect, useState } from "react";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = () => {
    api.get("/orders")
      .then(res => setOrders(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = (order, status) => {
    api.put("/orders/status", {
      customerName: order.customerName,
      product: order.product,
      status: status
    }).then(() => loadOrders());
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Orders Panel</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o, i) => (
            <tr key={i}>
              <td>{o.customerName}</td>
              <td>{o.product}</td>
              <td>{o.quantity}</td>
              <td>{o.status}</td>
              <td>
                <button onClick={() => updateStatus(o, "ACCEPTED")}>Accept</button>
                <button onClick={() => updateStatus(o, "PACKED")}>Pack</button>
                <button onClick={() => updateStatus(o, "DELIVERED")}>Deliver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Orders;
