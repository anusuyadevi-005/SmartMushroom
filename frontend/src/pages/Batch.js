import React, { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Batch() {
  const [batchId, setBatchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/batch", {
        batchId: batchId,
        startDate: startDate
      });

      setMessage("✅ Batch created successfully");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to create batch");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Create New Batch</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Batch ID</label><br />
          <input
            type="text"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Start Date</label><br />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <br />

        <button type="submit">Create Batch</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Batch;
