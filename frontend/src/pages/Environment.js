import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function Environment() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [weeklyHistory, setWeeklyHistory] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      api.get("/environment")
        .then(res => {
          setData(res.data);
          setError("");

          setHistory(prev => [
            ...prev.slice(-9), // keep last 10 points
            {
              time: res.data.lastUpdated,
              temperature: res.data.temperature,
              humidity: res.data.humidity
            }
          ]);
        })
        .catch(err => {
          console.error(err);
          setError("Unable to load environment data");
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 sec

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get("/environment/history/7days")
      .then(res => setWeeklyHistory(res.data))
      .catch(err => console.log(err));
  }, []);

  if (error) {
    return <p style={{ padding: "30px", color: "red" }}>{error}</p>;
  }

  if (!data) {
    return <p style={{ padding: "30px" }}>Loading environment data...</p>;
  }

  const tempColor =
    data.temperature > 35 ? "red" :
    data.temperature >= 25 ? "orange" : "green";

  return (
    <div style={{ padding: "30px", background: "#f4f6f8", minHeight: "100vh" }}>
      <h2>🌱 Environment Monitoring</h2>

      {/* INFO CARDS */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
        <Card title="Status" value={data.status} color="green" />
        <Card title="Temperature" value={`${data.temperature} °C`} color={tempColor} />
        <Card title="Humidity" value={`${data.humidity} %`} />
        <Card title="Air Quality" value={data.airQuality} />
        <Card title="Last Updated" value={data.lastUpdated} />
      </div>

      {/* LIVE CHART */}
      <div style={{
        marginTop: "40px",
        background: "#fff",
        padding: "20px",
        borderRadius: "14px",
        boxShadow: "0 6px 15px rgba(0,0,0,0.1)"
      }}>
        <h3>📈 Live Temperature & Humidity Trend</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ff7300"
              strokeWidth={2}
              name="Temperature (°C)"
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#387908"
              strokeWidth={2}
              name="Humidity (%)"
            />
          </LineChart>
        </ResponsiveContainer>
        
      </div>
      {/* Weekly Temperature History */}
<div style={{
  marginTop: "40px",
  padding: "20px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
}}>
  <h3>📅 Weekly Temperature & Humidity</h3>

  {weeklyHistory.length === 0 ? (
    <p>No weekly data available</p>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={weeklyHistory}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(t) => new Date(t).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(t) => new Date(t).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#ff7300"
          name="Temperature (°C)"
        />
        <Line
          type="monotone"
          dataKey="humidity"
          stroke="#387908"
          name="Humidity (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )}
</div>

    </div>
  );
}

// CARD COMPONENT
function Card({ title, value, color }) {
  return (
    <div style={{
      width: "220px",
      padding: "20px",
      borderRadius: "14px",
      background: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <h4 style={{ color: "#555" }}>{title}</h4>
      <h2 style={{ color: color || "#333" }}>{value}</h2>
    </div>
  );
}

export default Environment;
