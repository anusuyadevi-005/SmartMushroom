import React, { useState } from "react";
import api from "../services/api";

function Products() {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
    product: ""
  });

  const products = [
    "Fresh Oyster Mushroom",
    "Dried Oyster Mushroom",
    "Mushroom Pickle"
  ];

  const orderNow = async (product) => {
    setForm({ ...form, product });
  };

  const submitOrder = async () => {
    try {
      await api.post("/orders", form);
      alert("✅ Order placed successfully");
      setForm({ customerName: "", phone: "", quantity: 1, product: "" });
    } catch (err) {
      alert("❌ Order failed");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>🛒 Order Oyster Mushroom</h2>

      {products.map((p, i) => (
        <div key={i} style={card}>
          <h3>{p}</h3>
          <button onClick={() => orderNow(p)}>Order Now</button>
        </div>
      ))}

      {form.product && (
        <div style={{ marginTop: "30px" }}>
          <h3>Order: {form.product}</h3>

          <input
            placeholder="Customer Name"
            value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })}
          />
          <br /><br />

          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <br /><br />

          <input
            type="number"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />
          <br /><br />

          <button onClick={submitOrder}>Confirm Order</button>
        </div>
      )}
    </div>
  );
}

const card = {
  padding: "20px",
  border: "1px solid #ccc",
  marginBottom: "10px"
};

export default Products;
