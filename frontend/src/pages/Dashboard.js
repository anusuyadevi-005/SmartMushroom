import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Leaf, Scissors, Box, Scale, FileText, Activity, Home, AlertCircle, Thermometer, Droplet, Wind, BarChart2, Cpu, Calendar, Globe } from "lucide-react";

function Dashboard() {
  const [summary, setSummary] = useState({
    activeBatches: 0,
    totalOrders: 0,
    expiredBatches: 0,
    expiringSoon: 0
  });

  const [batches, setBatches] = useState([]);
  const [harvestPrediction, setHarvestPrediction] = useState(null);
  const [orderStats, setOrderStats] = useState([]);
  const [environment, setEnvironment] = useState(null);
  const [environmentHistory, setEnvironmentHistory] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [userOrderStats, setUserOrderStats] = useState({ totalOrders: 0, totalQuantity: 0, pending: 0, lastOrder: null });
  const [params] = useSearchParams();

  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  /* Save token after Google login */
  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [params]);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Public access allowed — just track login state to show CTAs and personalized features.
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  /* Load dashboard cards data */
  useEffect(() => {
    api.get("/dashboard/summary")
      .then(res => setSummary(res.data))
      .catch(err => console.error(err));
  }, []);

  /* Load all batches for table */
  useEffect(() => {
    api.get("/batch")
      .then(res => setBatches(res.data || []))
      .catch(() => setBatches([]));
  }, []);

  /* Load harvest predictions (admin-only) */
  useEffect(() => {
    if (!isAdmin) return;

    const fetchPrediction = () => {
      // Assuming 30 days since spawn for prediction
      api.post("/predict/harvest", { days_since_spawn: 30 })
        .then(res => setHarvestPrediction(res.data))
        .catch(err => console.log("Prediction error:", err));
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [isAdmin]);

  /* Load order statistics (admin-only) */
  useEffect(() => {
    if (!isAdmin) return;

    api.get("/orders/stats")
      .then(res => {
        console.log("Order stats response:", res.data);
        setOrderStats(res.data);
      })
      .catch(err => {
        console.log("Order stats error:", err);
        setOrderStats([]);
      });
  }, [isAdmin]);

  /* Load user-specific orders (user-only) */
  useEffect(() => {
    if (!isUser) return;

    api.get('/orders/my')
      .then(res => {
        setUserOrders(res.data || []);
        // compute stats
        const totalOrders = (res.data || []).length;
        const totalQuantity = (res.data || []).reduce((acc, o) => acc + (o.quantity || 0), 0);
        const pending = (res.data || []).filter(o => o.status === 'PENDING').length;
        const lastOrder = (res.data || []).length ? new Date(res.data[res.data.length - 1].createdAt) : null;
        setUserOrderStats({ totalOrders, totalQuantity, pending, lastOrder });
      })
      .catch(err => {
        console.log('Failed to load user orders', err);
        setUserOrders([]);
      });
  }, [isUser]);

  /* Load environment data */
  useEffect(() => {
    const fetchEnvironment = () => {
      api.get("/environment")
        .then(res => setEnvironment(res.data))
        .catch(err => console.log("Environment error:", err));
    };

    fetchEnvironment();
    const interval = setInterval(fetchEnvironment, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  /* Load environment history */
  useEffect(() => {
    const fetchEnvironmentHistory = () => {
      api.get("/environment/history/24h")
        .then(res => {
          const data = res.data.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            temperature: item.temperature,
            humidity: item.humidity
          }));
          setEnvironmentHistory(data);
        })
        .catch(err => console.log("Environment history error:", err));
    };

    fetchEnvironmentHistory();
    const interval = setInterval(fetchEnvironmentHistory, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Harvester Command Center Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl shadow-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center md:justify-start">
                <Leaf className="text-4xl md:text-5xl mr-3" />
                Harvester Command Center
              </h1>
              <p className="text-emerald-100 text-lg">Your mushroom cultivation control room</p>
              <div className="text-sm text-emerald-200 mt-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105">
                Start New Batch
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105">
                Check Environment
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105">
                Daily Checklist
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}

        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <strong>Public view:</strong> You can monitor environment and batch summaries here. <a href="/login" className="text-amber-600 font-medium">Sign in</a> to manage your farm, create batches and place orders.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isAdmin ? (
            <>
              <Card title="Active Batches" value={summary.activeBatches} icon={<Leaf className="w-10 h-10" />} color="from-green-400 to-green-600" />
              <Card title="Ready to Harvest" value={summary.expiringSoon} icon={<Scissors className="w-10 h-10" />} color="from-yellow-400 to-orange-600" />
              <Card title="Pending Orders" value={summary.totalOrders} icon={<Box className="w-10 h-10" />} color="from-blue-400 to-blue-600" />
              <Card title="Today's Yield" value="2.4kg" icon={<Scale className="w-10 h-10" />} color="from-purple-400 to-pink-600" />
            </>
          ) : isUser ? (
            <>
              <Card title="My Orders" value={userOrderStats.totalOrders} icon={<FileText className="w-10 h-10" />} color="from-blue-400 to-blue-600" />
              <Card title="Pending" value={userOrderStats.pending} icon={<Leaf className="w-10 h-10" />} color="from-yellow-400 to-orange-600" />
              <Card title="Items Ordered" value={userOrderStats.totalQuantity} icon={<Box className="w-10 h-10" />} color="from-green-400 to-green-600" />
              <Card title="Last Order" value={userOrderStats.lastOrder ? userOrderStats.lastOrder.toLocaleDateString() : '—'} icon={<Activity className="w-10 h-10" />} color="from-purple-400 to-pink-600" />
            </>
          ) : (
            <>
              <Card title="Active Batches" value={summary.activeBatches} icon={<Leaf className="w-10 h-10" />} color="from-green-400 to-green-600" />
              <Card title="Ready to Harvest" value={summary.expiringSoon} icon={<Scissors className="w-10 h-10" />} color="from-yellow-400 to-orange-600" />
              <Card title="Pending Orders" value={summary.totalOrders} icon={<Box className="w-10 h-10" />} color="from-blue-400 to-blue-600" />
              <Card title="Today's Yield" value="2.4kg" icon={<Scale className="w-10 h-10" />} color="from-purple-400 to-pink-600" />
            </>
          )}
        </div>

        {/* Batch Lifecycle Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Leaf className="text-3xl mr-3" />
            Cultivation Pipeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <div className="text-4xl mb-2"><Activity className="w-10 h-10 inline" /></div>
              <h3 className="font-semibold text-gray-800">Spawn</h3>
              <p className="text-sm text-gray-600">Grain spawn preparation</p>
              <div className="mt-2 text-xs bg-gray-300 rounded-full h-2">
                <div className="bg-gray-600 h-2 rounded-full w-3/4"></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <div className="text-4xl mb-2"><Home className="w-10 h-10 inline" /></div>
              <h3 className="font-semibold text-gray-800">Incubation</h3>
              <p className="text-sm text-gray-600">Mycelium colonization</p>
              <div className="mt-2 text-xs bg-blue-300 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <div className="text-4xl mb-2"><Leaf className="w-10 h-10 inline" /></div>
              <h3 className="font-semibold text-gray-800">Fruiting</h3>
              <p className="text-sm text-gray-600">Pin formation & growth</p>
              <div className="mt-2 text-xs bg-green-300 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-1/4"></div>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-lg">
              <div className="text-4xl mb-2"><Scissors className="w-10 h-10 inline" /></div>
              <h3 className="font-semibold text-gray-800">Harvest</h3>
              <p className="text-sm text-gray-600">Ready for picking</p>
              <div className="mt-2 text-xs bg-yellow-300 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full w-1/6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Alerts & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Critical Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="text-red-500 text-2xl mr-2" />
              Critical Alerts
            </h3>
            <div className="space-y-3">
              {summary.expiredBatches > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-red-800 font-medium">Expired Batches: {summary.expiredBatches}</p>
                  <p className="text-red-600 text-sm">Harvest immediately or discard</p>
                </div>
              )}
              {summary.expiringSoon > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-yellow-800 font-medium">Ready to Harvest: {summary.expiringSoon}</p>
                  <p className="text-yellow-600 text-sm">Check fruiting chambers</p>
                </div>
              )}
              {environment && environment.temperature > 28 && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                  <p className="text-orange-800 font-medium">High Temperature Alert</p>
                  <p className="text-orange-600 text-sm">Reduce heating, increase ventilation</p>
                </div>
              )}
              {environment && environment.humidity < 80 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="text-blue-800 font-medium">Low Humidity Alert</p>
                  <p className="text-blue-600 text-sm">Increase misting frequency</p>
                </div>
              )}
              {(!summary.expiredBatches || summary.expiredBatches === 0) &&
               (!summary.expiringSoon || summary.expiringSoon === 0) &&
               (!environment || (environment.temperature <= 28 && environment.humidity >= 80)) && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <p className="text-green-800 font-medium">All Systems Normal</p>
                  <p className="text-green-600 text-sm">Optimal growing conditions maintained</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Checklist */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="text-green-500 text-2xl mr-2" />
              Daily Harvester Checklist
            </h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Check environmental readings</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Inspect fruiting chambers</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Monitor mycelium growth</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Check spawn bags for contamination</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Record harvest yields</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" />
                <span className="text-gray-700">Clean and sanitize equipment</span>
              </label>
            </div>
            <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Mark All Complete
            </button>
          </div>
        </div>

        {/* Environment Monitoring */}
        {environment && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4"><Globe className="inline -mt-1 mr-2" /> Current Environment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-red-400 to-red-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Temperature</h3>
                    <p className="text-3xl font-bold">{environment.temperature} °C</p>
                  </div>
                  <div className="text-4xl"><Thermometer className="w-12 h-12 inline" /></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Humidity</h3>
                    <p className="text-3xl font-bold">{environment.humidity} %</p>
                  </div>
                  <div className="text-4xl"><Droplet className="w-12 h-12 inline" /></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Air Quality</h3>
                    <p className="text-3xl font-bold">{environment.airQuality}</p>
                  </div>
                  <div className="text-4xl"><Wind className="w-12 h-12 inline" /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Environment History Line Chart */}
        {environmentHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4"><BarChart2 className="inline -mt-1 mr-2" /> Environment History (Last 24 Hours)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={environmentHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#387908" strokeWidth={2} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-gray-600 text-sm mt-4">
              Historical data showing temperature and humidity trends over the last 24 hours. Updates every minute.
            </p>
          </div>
        )}

        {/* ML Harvest Predictions (admin-only) */}
        {isAdmin && harvestPrediction && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4"><Cpu className="inline -mt-1 mr-2" /> ML Harvest Predictions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Expected Harvest Day</h3>
                    <p className="text-3xl font-bold">{harvestPrediction.expected_harvest_day} days</p>
                  </div>
                  <div className="text-4xl"><Calendar className="w-10 h-10 inline" /></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Expected Yield</h3>
                    <p className="text-3xl font-bold">{harvestPrediction.expected_yield_kg} kg</p>
                  </div>
                  <div className="text-4xl">🌾</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-400 to-red-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Based on Temp</h3>
                    <p className="text-3xl font-bold">{harvestPrediction.current_temperature} °C</p>
                  </div>
                  <div className="text-4xl"><Thermometer className="w-12 h-12 inline" /></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-400 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Based on Humidity</h3>
                    <p className="text-3xl font-bold">{harvestPrediction.current_humidity} %</p>
                  </div>
                  <div className="text-4xl"><Droplet className="w-12 h-12 inline" /></div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Predictions based on current environmental conditions and 30 days since spawn. Updates every 5 minutes.
            </p>
          </div>
        )}

        {/* Order Statistics (admin-only) or User Orders */}
        {isAdmin ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4"><BarChart2 className="inline -mt-1 mr-2" /> Product Order Distribution</h2>
            {orderStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={orderStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ product, count }) => `${product}: ${count}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {orderStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getProductColor(entry.product)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No order data available</p>
            )}
          </div>
        ) : isUser ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4"><FileText className="inline -mt-1 mr-2" /> Your Recent Orders</h2>
            {userOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">You haven't placed any orders yet. Visit the <a href="/products" className="text-amber-600 underline">Shop</a> to start.</p>
            ) : (
              <div className="space-y-3">
                {userOrders.slice().reverse().slice(0,5).map((o) => (
                  <div key={o._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{o.product} × {o.quantity}</div>
                      <div className="text-xs text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</div>
                    </div>
                    <div className="text-sm px-3 py-1 rounded-lg bg-gray-100">{o.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Batch Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4"><Leaf className="inline -mt-1 mr-2" /> All Batches</h2>

          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Batch ID</th>
                <th className="border px-4 py-2">Start Date</th>
                <th className="border px-4 py-2">Expiry Date</th>
                <th className="border px-4 py-2">Progress</th>
                <th className="border px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">
                    No batches found
                  </td>
                </tr>
              ) : (
                batches.map((b, i) => {
                  const startDate = new Date(b.startDate);
                  const expiryDate = new Date(b.expiryDate);
                  const now = new Date();
                  const totalDays = Math.ceil((expiryDate - startDate) / (1000 * 60 * 60 * 24));
                  const daysPassed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
                  const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

                  return (
                    <tr key={i} className="text-center">
                      <td className="border px-4 py-2">{b.batchId}</td>
                      <td className="border px-4 py-2">{b.startDate}</td>
                      <td className="border px-4 py-2">{b.expiryDate}</td>
                      <td className="border px-4 py-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                      </td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded text-white ${
                          b.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                        }`}>
                          {b.status}
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
  );
}

/* Card Component */
function Card({ title, value, icon, color }) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

/* Helper function for pie chart colors */
function getProductColor(product) {
  const colors = [
    "#ff7300", // Orange
    "#387908", // Green
    "#2196F3", // Blue
    "#f44336", // Red
    "#9c27b0", // Purple
    "#ff9800", // Orange
    "#4caf50", // Light Green
    "#00bcd4", // Cyan
    "#e91e63", // Pink
    "#607d8b"  // Blue Grey
  ];

  // Use product name to generate consistent color index
  let hash = 0;
  for (let i = 0; i < product.length; i++) {
    hash = product.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default Dashboard;
