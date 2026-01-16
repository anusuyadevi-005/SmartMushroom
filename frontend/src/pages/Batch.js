import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function Batch() {
  const [batchId, setBatchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [growthDays, setGrowthDays] = useState(90);
  const [estimatedHarvest, setEstimatedHarvest] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchType, setBatchType] = useState("oyster-mushroom");
  const [showPreview, setShowPreview] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage("");
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!batchId || batchId.trim().length < 3) {
      newErrors.batchId = "Batch ID must be at least 3 characters";
    }
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const selected = new Date(startDate);
      const today = new Date();
      // Zero out time for comparison
      selected.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      if (selected > today) {
        newErrors.startDate = "Start date cannot be in the future";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/batch", {
        batchId: batchId.trim(),
        startDate: startDate,
        growthDays: growthDays
      });

      setExpiryDate(response.data.expiryDate);
      setMessage("Batch created successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error(error);
      setMessage("Failed to create batch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate a friendly batch id
  const generateBatchId = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BATCH-${y}${m}${d}-${rand}`;
  };

  const handleGenerate = () => {
    setBatchId(generateBatchId());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(batchId);
      setMessage('Batch ID copied to clipboard');
      setTimeout(() => setMessage(''), 1500);
    } catch (e) {
      setMessage('Unable to copy');
    }
  };

  // Fetch ML predictions based on batch age
  const fetchPrediction = async (daysSinceSpawn) => {
    if (!daysSinceSpawn || daysSinceSpawn < 0) {
      setMlPrediction(null);
      return;
    }

    setPredictionLoading(true);
    try {
      const response = await api.post("/predict/harvest", { days_since_spawn: daysSinceSpawn });
      setMlPrediction(response.data);
    } catch (error) {
      console.log("ML Prediction error:", error);
      setMlPrediction(null);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Compute estimated harvest date and expiry when startDate or growthDays change
  useEffect(() => {
    if (!startDate) {
      setEstimatedHarvest('');
      setExpiryDate('');
      setMlPrediction(null);
      return;
    }
    const sd = new Date(startDate);
    sd.setHours(0,0,0,0);

    // Calculate harvest date
    const harvest = new Date(sd);
    harvest.setDate(harvest.getDate() + Number(growthDays || 0));
    setEstimatedHarvest(harvest.toISOString().slice(0,10));

    // Calculate expiry date (start + 2 days as per backend)
    const expiry = new Date(sd);
    expiry.setDate(expiry.getDate() + 2);
    setExpiryDate(expiry.toISOString().slice(0,10));

    // Fetch ML predictions for the batch (using 0 days since spawn for new batch)
    fetchPrediction(0);
  }, [startDate, growthDays]);

  const getBatchTypeIcon = (type) => {
    switch (type) {
      case 'oyster-mushroom': return '🍄';
      case 'button-mushroom': return '🍄';
      case 'shiitake': return '🍄';
      default: return '🌱';
    }
  };

  const getBatchTypeName = (type) => {
    switch (type) {
      case 'oyster-mushroom': return 'Oyster Mushroom';
      case 'button-mushroom': return 'Button Mushroom';
      case 'shiitake': return 'Shiitake';
      default: return 'Custom Batch';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🌱 Create New Batch</h1>
              <p className="text-emerald-100 text-lg">Start a new mushroom cultivation batch with smart predictions</p>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl opacity-20">{getBatchTypeIcon(batchType)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Batch Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Batch Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'oyster-mushroom', label: 'Oyster Mushroom', icon: '🍄' },
                      { value: 'button-mushroom', label: 'Button Mushroom', icon: '🍄' },
                      { value: 'shiitake', label: 'Shiitake', icon: '🍄' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setBatchType(type.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          batchType === type.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-sm font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Batch ID</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        disabled={loading}
                        placeholder="e.g. BATCH-20241201-1234"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
                          errors.batchId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors.batchId && <div className="text-red-600 text-sm mt-1">{errors.batchId}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      🎲 Generate
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!batchId || loading}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
                      errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.startDate && <div className="text-red-600 text-sm mt-1">{errors.startDate}</div>}
                </div>

                {/* Growth Period and Harvest Estimate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Growth Period (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={growthDays}
                      onChange={(e) => setGrowthDays(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Estimated Harvest</label>
                    <input
                      type="date"
                      value={estimatedHarvest}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>

                {/* ML Predictions Card */}
                {startDate && (
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-2xl mr-2">🤖</span>
                      AI Harvest Predictions
                    </h3>

                    {predictionLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mr-3"></div>
                        <span className="text-lg">Analyzing environmental data...</span>
                      </div>
                    ) : mlPrediction ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold mb-1">{mlPrediction.expected_harvest_day}</div>
                          <div className="text-sm opacity-90">Days to Harvest</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold mb-1">{mlPrediction.expected_yield_kg} kg</div>
                          <div className="text-sm opacity-90">Expected Yield</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                          <div className="text-sm mb-1">Based on current conditions:</div>
                          <div className="text-xs opacity-90">
                            {mlPrediction.current_temperature}°C, {mlPrediction.current_humidity}% humidity
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-lg mb-2">Unable to load predictions</div>
                        <div className="text-sm opacity-90">Please check your connection and try again</div>
                      </div>
                    )}

                    <div className="mt-4 text-xs opacity-75 text-center">
                      Predictions are based on machine learning models trained on environmental data and cultivation patterns
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Creating Batch...
                        </div>
                      ) : (
                        '🚀 Create Batch'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.toLowerCase().includes('failed') || message.toLowerCase().includes('unable')
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                    <div className="flex items-center">
                      <span className="text-xl mr-2">
                        {message.toLowerCase().includes('failed') ? '❌' : '✅'}
                      </span>
                      {message}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className={`bg-white rounded-xl shadow-lg transition-all duration-300 ${
              showPreview ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4 pointer-events-none'
            }`}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">👁️</span>
                  Batch Preview
                </h3>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-lg text-white">
                    <div className="text-sm opacity-90">Batch Type</div>
                    <div className="text-xl font-bold">{getBatchTypeIcon(batchType)} {getBatchTypeName(batchType)}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Batch ID:</span>
                      <span className="font-medium text-gray-900">{batchId || 'Not set'}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium text-gray-900">
                        {startDate ? new Date(startDate).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium text-gray-900">
                        {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Growth Period:</span>
                      <span className="font-medium text-gray-900">{growthDays} days</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Est. Harvest:</span>
                      <span className="font-medium text-gray-900">
                        {estimatedHarvest ? new Date(estimatedHarvest).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* ML Predictions */}
                  {predictionLoading ? (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90">🤖 ML Predictions</div>
                      <div className="flex items-center mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    </div>
                  ) : mlPrediction ? (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white">
                      <div className="text-sm opacity-90">🤖 ML Predictions</div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="text-xs opacity-75">Expected Harvest Day</div>
                          <div className="text-lg font-bold">{mlPrediction.expected_harvest_day} days</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">Expected Yield</div>
                          <div className="text-lg font-bold">{mlPrediction.expected_yield_kg} kg</div>
                        </div>
                      </div>
                      <div className="text-xs opacity-75 mt-2">
                        Based on current temp: {mlPrediction.current_temperature}°C, humidity: {mlPrediction.current_humidity}%
                      </div>
                    </div>
                  ) : startDate ? (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">🤖 ML Predictions</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Set a start date to see AI-powered predictions
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-700 mb-2">💡 Pro Tip</div>
                    <div className="text-xs text-blue-600">
                      Monitor your batch regularly and maintain optimal temperature (20-25°C) and humidity (85-90%) for best results.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Batch;
