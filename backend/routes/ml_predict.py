from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ml.predict import predict_yield
from db import env_col

ml_bp = Blueprint("ml", __name__)

# ------------------ YIELD PREDICTION ------------------
@ml_bp.route("/predict/yield", methods=["POST"])
@cross_origin()
def predict():
    data = request.get_json(force=True, silent=True) or {}

    temperature = data.get("temperature")
    humidity = data.get("humidity")
    air_quality = data.get("air_quality", 1)
    days = data.get("days_since_spawn")

    if temperature is None or humidity is None or days is None:
        return jsonify({"error": "Missing input data"}), 400

    result = predict_yield(temperature, humidity, air_quality, days)
    return jsonify(result), 200


# ------------------ HARVEST PREDICTION ------------------
@ml_bp.route("/predict/harvest", methods=["POST"])
@cross_origin()
def predict_harvest():
    data = request.get_json(force=True, silent=True) or {}
    batch_age = data.get("days_since_spawn")

    if batch_age is None:
        return jsonify({"error": "Missing days_since_spawn"}), 400

    # Fetch latest environment data
    env_data = env_col.find_one(sort=[("recordedAt", -1)], projection={"_id": 0})

    if not env_data:
        temperature = 25
        humidity = 85
        air_quality = 1
    else:
        temperature = env_data.get("temperature", 25)
        humidity = env_data.get("humidity", 85)

        air_quality_raw = env_data.get("airQuality", "NORMAL AIR")
        air_quality_map = {
            "CLEAR SKY": 1,
            "FEW CLOUDS": 1,
            "SCATTERED CLOUDS": 1,
            "BROKEN CLOUDS": 2,
            "OVERCAST CLOUDS": 2,
            "LIGHT RAIN": 2,
            "MODERATE RAIN": 2,
            "NORMAL AIR": 1,
            "UNKNOWN": 1
        }
        air_quality = air_quality_map.get(str(air_quality_raw).upper(), 1)

    result = predict_yield(temperature, humidity, air_quality, batch_age)

    return jsonify({
        "current_temperature": temperature,
        "current_humidity": humidity,
        "current_air_quality": air_quality,
        **result
    }), 200
