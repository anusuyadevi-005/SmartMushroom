import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

function BatchManagement() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Maintenance form states
  const [maintenanceType, setMaintenanceType] = useState("");
  const [maintenanceValue, setMaintenanceValue] = useState("");
  const [maintenanceNotes, setMaintenanceNotes] = useState("");

  // Harvest form states
  const [actualYield, setActualYield] = useState("");
  const [qualityScore, setQualityScore] = useState(5);
  const [harvestNotes, setHarvestNotes] = useState("");

  // Environment form states
  const [envTemp, setEnvTemp] = useState("");
  const [envHumidity, setEnvHumidity] = useState("");
  const [envCo2, setEnvCo2] = useState("");
  const [envLight, setEnvLight] = useState("");

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  const loadBatch = async () => {
    try {
      const response = await api.get(`/batch/${batchId}`);
      setBatch(response.data);
    } catch (error) {
      console.error("Failed to load batch:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (newStage, notes = "") => {
    try {
      await api.put(`/batch/${batchId}/stage`, { stage: newStage, notes });
      await loadBatch(); // Refresh data
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  const logMaintenance = async () => {
    if (!maintenanceType) return;

    try {
      await api.post(`/batch/${batchId}/maintenance`, {
        type: maintenanceType,
        value: maintenanceValue,
        notes: maintenanceNotes
      });
      setMaintenanceType("");
      setMaintenanceValue("");
      setMaintenanceNotes("");
      await loadBatch();
    } catch (error) {
      console.error("Failed to log maintenance:", error);
    }
  };

  const recordHarvest = async () => {
    if (!actualYield) return;

    try {
      await api.post(`/batch/${batchId}/harvest`, {
        actualYield: parseFloat(actualYield),
        qualityScore: parseInt(qualityScore),
        notes: harvestNotes
      });
      await loadBatch();
    } catch (error) {
      console.error("Failed to record harvest:", error);
    }
  };

  const updateEnvironment = async () => {
    try {
      await api.put(`/batch/${batchId}/environment`, {
        temperature: envTemp ? parseFloat(envTemp) : undefined,
        humidity: envHumidity ? parseFloat(envHumidity) : undefined,
        co2Level: envCo2 ? parseFloat(envCo2) : undefined,
        lightLevel: envLight ? parseFloat(envLight) : undefined
      });
      setEnvTemp("");
      setEnvHumidity("");
      setEnvCo2("");
      setEnvLight("");
      await loadBatch();
    } catch (error) {
      console.error("Failed to update environment:", error);
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case "SPAWN": return "🧬";
      case "INCUBATION": return "🏠";
      case "FRUITING": return "🌿";
      case "HARVEST": return "✂️";
      case "COMPLETED": return "✅";
      default: return "🌱";
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "SPAWN": return "bg-gray-500";
      case "INCUBATION": return "bg-blue-500";
      case "FRUITING": return "bg-green-500";
      case "HARVEST": return "bg-yellow-500";
      case "COMPLETED": return "bg-purple-500";
      default: return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Batch Not Found</h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Batch {batch.batchId}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Started: {new Date(batch.startDate).toLocaleDateString()}</span>
                <span>Expires: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                <span className={`px-3 py-1 rounded-full text-white text-xs ${getStageColor(batch.stage || 'SPAWN')}`}>
                  {getStageIcon(batch.stage || 'SPAWN')} {batch.stage || 'SPAWN'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 md:mt-0 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: "overview", label: "Overview", icon: "📊" },
                { id: "maintenance", label: "Maintenance", icon: "🔧" },
                { id: "environment", label: "Environment", icon: "🌡️" },
                { id: "harvest", label: "Harvest", icon: "✂️" },
                { id: "logs", label: "Activity Log", icon: "📝" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Current Stage</h3>
                    <div className="text-3xl mb-2">{getStageIcon(batch.stage || 'SPAWN')}</div>
                    <p className="text-blue-100">{batch.stage || 'SPAWN'}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Days Active</h3>
                    <div className="text-3xl mb-2">
                      {Math.ceil((new Date() - new Date(batch.startDate)) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-green-100">Since spawn</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Status</h3>
                    <div className="text-3xl mb-2">
                      {batch.status === 'ACTIVE' ? '🟢' : '🔴'}
                    </div>
                    <p className="text-purple-100">{batch.status}</p>
                  </div>
                </div>

                {/* Stage Controls */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Update Batch Stage</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["SPAWN", "INCUBATION", "FRUITING", "HARVEST", "COMPLETED"].map((stage) => (
                      <button
                        key={stage}
                        onClick={() => updateStage(stage)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          batch.stage === stage
                            ? `${getStageColor(stage)} text-white`
                            : "bg-white border-2 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {getStageIcon(stage)} {stage}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Log Maintenance Activity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select maintenance type...</option>
                      <option value="watering">💧 Watering</option>
                      <option value="co2_adjustment">🌬️ CO2 Adjustment</option>
                      <option value="temperature_check">🌡️ Temperature Check</option>
                      <option value="humidity_check">💨 Humidity Check</option>
                      <option value="light_adjustment">💡 Light Adjustment</option>
                      <option value="contamination_check">🔍 Contamination Check</option>
                      <option value="substrate_check">🌱 Substrate Check</option>
                      <option value="other">📝 Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Value/Measurement (optional)"
                      value={maintenanceValue}
                      onChange={(e) => setMaintenanceValue(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="Notes..."
                    value={maintenanceNotes}
                    onChange={(e) => setMaintenanceNotes(e.target.value)}
                    className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <button
                    onClick={logMaintenance}
                    disabled={!maintenanceType}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                  >
                    Log Maintenance
                  </button>
                </div>
              </div>
            )}

            {/* Environment Tab */}
            {activeTab === "environment" && (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Update Batch Environment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Temperature (°C)"
                      value={envTemp}
                      onChange={(e) => setEnvTemp(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Humidity (%)"
                      value={envHumidity}
                      onChange={(e) => setEnvHumidity(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="1"
                      placeholder="CO2 Level (ppm)"
                      value={envCo2}
                      onChange={(e) => setEnvCo2(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="1"
                      placeholder="Light Level (lux)"
                      value={envLight}
                      onChange={(e) => setEnvLight(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={updateEnvironment}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  >
                    Update Environment
                  </button>
                </div>

                {/* Current Environment Display */}
                {batch.currentEnvironment && (
                  <div className="bg-white rounded-xl p-6 border">
                    <h3 className="text-lg font-semibold mb-4">Current Batch Environment</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {batch.currentEnvironment.temperature && (
                        <div className="text-center">
                          <div className="text-2xl">🌡️</div>
                          <div className="font-semibold">{batch.currentEnvironment.temperature}°C</div>
                          <div className="text-sm text-gray-500">Temperature</div>
                        </div>
                      )}
                      {batch.currentEnvironment.humidity && (
                        <div className="text-center">
                          <div className="text-2xl">💧</div>
                          <div className="font-semibold">{batch.currentEnvironment.humidity}%</div>
                          <div className="text-sm text-gray-500">Humidity</div>
                        </div>
                      )}
                      {batch.currentEnvironment.co2Level && (
                        <div className="text-center">
                          <div className="text-2xl">🌬️</div>
                          <div className="font-semibold">{batch.currentEnvironment.co2Level} ppm</div>
                          <div className="text-sm text-gray-500">CO2</div>
                        </div>
                      )}
                      {batch.currentEnvironment.lightLevel && (
                        <div className="text-center">
                          <div className="text-2xl">💡</div>
                          <div className="font-semibold">{batch.currentEnvironment.lightLevel} lux</div>
                          <div className="text-sm text-gray-500">Light</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Harvest Tab */}
            {activeTab === "harvest" && (
              <div className="space-y-6">
                {batch.stage === "COMPLETED" ? (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">Harvest Completed ✅</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Actual Yield</label>
                        <div className="text-2xl font-bold text-green-600">{batch.actualYield} kg</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Score</label>
                        <div className="text-2xl font-bold text-green-600">{batch.qualityScore}/10</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-yellow-800">Record Harvest</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Actual yield (kg)"
                        value={actualYield}
                        onChange={(e) => setActualYield(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Score</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={qualityScore}
                          onChange={(e) => setQualityScore(e.target.value)}
                          className="w-full"
                        />
                        <div className="text-center text-lg font-bold text-yellow-600">{qualityScore}/10</div>
                      </div>
                    </div>
                    <textarea
                      placeholder="Harvest notes..."
                      value={harvestNotes}
                      onChange={(e) => setHarvestNotes(e.target.value)}
                      className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      rows="3"
                    />
                    <button
                      onClick={recordHarvest}
                      disabled={!actualYield}
                      className="mt-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
                    >
                      Record Harvest
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity Log</h3>
                {batch.maintenanceLogs && batch.maintenanceLogs.length > 0 ? (
                  <div className="space-y-3">
                    {batch.maintenanceLogs
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((log, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-800">{log.action}</div>
                              {log.value && <div className="text-sm text-gray-600">Value: {log.value}</div>}
                              {log.notes && <div className="text-sm text-gray-600 mt-1">{log.notes}</div>}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No activity logs yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchManagement;
