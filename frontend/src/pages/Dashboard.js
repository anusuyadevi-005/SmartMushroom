import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";

function Dashboard() {
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expiry, setExpiry] = useState({
    expired: [],
    expiringSoon: []
  });

  const [params] = useSearchParams();

  /* Function to check if batch is expired based on 2-day rule */
  const checkBatchExpiry = (batch) => {
    if (!batch.startDate || batch.status !== "ACTIVE") return false;
    
    const startDate = new Date(batch.startDate);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If more than 2 days have passed, it should be expired
    return diffDays > 2;
  };

  /* Save token after Google login */
  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [params]);

  /* Load all dashboard data */
  useEffect(() => {
    api.get("/batch")
      .then(res => setBatches(res.data || []))
      .catch(() => setBatches([]));

    api.get("/orders")
      .then(res => setOrders(res.data || []))
      .catch(() => setOrders([]));

    // Get expiry data from API
    api.get("/expiry")
      .then(res =>
        setExpiry({
          expired: res.data?.expired || [],
          expiringSoon: res.data?.expiringSoon || []
        })
      )
      .catch(() =>
        setExpiry({
          expired: [],
          expiringSoon: []
        })
      );
  }, []);

  const activeBatches = batches?.filter(b => 
    b.status === "ACTIVE" && !checkBatchExpiry(b)
  ).length || 0;

  // Get actual expired count
  const expiredCount = batches?.filter(checkBatchExpiry).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">📊 AgroSense Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card title="Active Batches" value={activeBatches} icon="🌱" color="from-green-400 to-green-600" />
          <Card title="Total Orders" value={orders.length} icon="📦" color="from-blue-400 to-blue-600" />
          <Card title="Expired Batches" value={expiredCount} icon="⚠️" color="from-red-400 to-red-600" />
          <Card title="Expiring Soon" value={expiry.expiringSoon.length} icon="⏰" color="from-yellow-400 to-orange-600" />
        </div>

        {/* Batch Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🌱 Batch Details</h2>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Batch ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Expiry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No batches found</td>
                  </tr>
                ) : (
                  batches.map((b, i) => {
                    const isExpired = checkBatchExpiry(b);
                    const actualStatus = isExpired ? "EXPIRED" : b.status;

                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.batchId}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{b.startDate}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            actualStatus === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {actualStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {isExpired ? "EXPIRED" : "ACTIVE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable Card */
function Card({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

export default Dashboard;