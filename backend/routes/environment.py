from flask import Blueprint, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
from db import env_col, env_history_col

env_bp = Blueprint("environment", __name__)

# ---------------- CURRENT ENVIRONMENT ----------------
@env_bp.route("/environment", methods=["GET"])
@cross_origin()
def get_environment():
    data = env_col.find_one({}, {"_id": 0})

    now_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not data:
        return jsonify({
            "status": "SAFE",
            "temperature": 0,
            "humidity": 0,
            "airQuality": "UNKNOWN",
            "lastUpdated": now_time
        })

    # ✅ Force real-time lastUpdated
    data["lastUpdated"] = now_time

    # ✅ Safety fallback for airQuality
    if not data.get("airQuality"):
        data["airQuality"] = "NORMAL AIR"

    return jsonify({
        "status": data.get("status", "SAFE"),
        "temperature": data.get("temperature", 0),
        "humidity": data.get("humidity", 0),
        "airQuality": data.get("airQuality"),
        "lastUpdated": data["lastUpdated"]
    })


# ---------------- LAST 24 HOURS HISTORY ----------------
@env_bp.route("/environment/history/24h", methods=["GET"])
@cross_origin()
def get_environment_history():
    since = datetime.now() - timedelta(hours=24)

    history = list(
        env_history_col.find(
            {"timestamp": {"$gte": since}},
            {"_id": 0}
        )
    )

    return jsonify(history)


# ---------------- INSERT MOCK DATA ----------------
@env_bp.route("/environment/mock", methods=["POST"])
@cross_origin()
def insert_mock_data():
    record = {
        "status": "SAFE",
        "temperature": 20.5,
        "humidity": 86,
        "airQuality": "OVERCAST CLOUDS",
        "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "timestamp": datetime.now()
    }

    env_col.delete_many({})
    env_col.insert_one(record)
    env_history_col.insert_one(record)

    return jsonify({"message": "Mock environment data inserted"})
# ---------------- LAST 7 DAYS HISTORY ----------------
@env_bp.route("/environment/history/7days", methods=["GET"])
@cross_origin()
def get_environment_weekly_history():
    since = datetime.now() - timedelta(days=7)

    history = list(
        env_history_col.find(
            {"timestamp": {"$gte": since}},
            {"_id": 0}
        ).sort("timestamp", 1)
    )

    return jsonify(history)
