from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ml.predict import predict_yield
from db import env_col

ml_bp = Blueprint("ml", __name__)

@ml_bp.route("/predict/yield", methods=["POST"])
@cross_origin()
def predict():
    data = request.json

    temperature = data.get("temperature")
    humidity = data.get("humidity")
    days = data.get("days_since_spawn")

    if temperature is None or humidity is None or days is None:
        return jsonify({"error": "Missing input data"}), 400

    result = predict_yield(temperature, humidity, days)

    return jsonify(result)

@ml_bp.route("/predict/harvest", methods=["POST"])
@cross_origin()
def predict_harvest():
    data = request.json
    batch_age = data.get("days_since_spawn")

    if batch_age is None:
        return jsonify({"error": "Missing days_since_spawn"}), 400

    # Get current environment data
    env_data = env_col.find_one({}, {"_id": 0})
    if not env_data or not env_data.get("temperature") or not env_data.get("humidity") or not env_data.get("airQuality"):
        return jsonify({"error": "No environment data available"}), 400

    temperature = env_data["temperature"]
    humidity = env_data["humidity"]
    air_quality = env_data["airQuality"]

    result = predict_yield(temperature, humidity, air_quality, batch_age)

    return jsonify({
        "current_temperature": temperature,
        "current_humidity": humidity,
        "current_air_quality": air_quality,
        **result
    })
