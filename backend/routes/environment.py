from flask import Blueprint, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
from db import env_col, env_history_col
import requests
import os

# Try to load dotenv, but don't fail if it's not available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not available, continue without it
    pass

env_bp = Blueprint("environment", __name__)

# Helper function to fetch real-time weather data
def fetch_weather_data():
    # For demo purposes, return None to use mock data instead
    # Uncomment below lines if you have a valid OpenWeather API key
    # api_key = os.getenv("OPENWEATHER_API_KEY", "your_api_key_here")
    # city = "Chennai"
    # url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

    # try:
    #     response = requests.get(url)
    #     response.raise_for_status()
    #     data = response.json()
    #
    #     temperature = data['main']['temp']
    #     humidity = data['main']['humidity']
    #     weather_description = data['weather'][0]['description'].title()
    #
    #     return {
    #         "temperature": temperature,
    #         "humidity": humidity,
    #         "airQuality": weather_description,
    #         "status": "SAFE" if temperature < 35 else "WARNING"
    #     }
    # except Exception as e:
    #     print(f"Error fetching weather data: {e}")
    #     return None

    # Return None to use mock data from database
    return None

# ---------------- CURRENT ENVIRONMENT ----------------
@env_bp.route("/environment", methods=["GET"])
@cross_origin()
def get_environment():
    # Try to fetch real-time data first
    real_data = fetch_weather_data()
    now_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if real_data:
        # Store in database for history
        record = {
            **real_data,
            "lastUpdated": now_time,
            "timestamp": datetime.now()
        }
        env_col.delete_many({})  # Keep only latest
        env_col.insert_one(record)
        env_history_col.insert_one(record)

        return jsonify({
            **real_data,
            "lastUpdated": now_time,
            "hasData": True
        })

    # Fallback to database if API fails
    data = env_col.find_one({}, {"_id": 0})

    if not data:
        return jsonify({
            "status": "SAFE",
            "temperature": 0,
            "humidity": 0,
            "airQuality": "UNKNOWN",
            "lastUpdated": now_time,
            "hasData": False
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
        "lastUpdated": data["lastUpdated"],
        "hasData": True
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
# ---------------- DAILY HISTORY (TODAY) ----------------
@env_bp.route("/environment/history/today", methods=["GET"])
@cross_origin()
def get_environment_daily_history():
    # Get start of today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    history = list(
        env_history_col.find(
            {"timestamp": {"$gte": today_start}},
            {"_id": 0}
        ).sort("timestamp", 1)
    )

    # Serialize datetime objects to strings for JSON
    def _serialize(doc):
        d = dict(doc)
        ts = d.get("timestamp")
        if isinstance(ts, datetime):
            d["timestamp"] = ts.isoformat()
        return d

    return jsonify([_serialize(d) for d in history])

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

    # Serialize datetime objects to strings for JSON
    def _serialize(doc):
        d = dict(doc)
        ts = d.get("timestamp")
        if isinstance(ts, datetime):
            d["timestamp"] = ts.isoformat()
        return d

    return jsonify([_serialize(d) for d in history])
