from flask import Blueprint, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
from collections import defaultdict
from db import env_col, env_history_col
import requests
import os

# ---------------- HELPER ----------------
def get_last_today_record():
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return env_history_col.find_one(
        {"timestamp": {"$gte": today_start}},
        sort=[("timestamp", -1)]
    )

# Try to load dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

env_bp = Blueprint("environment", __name__)

# ---------------- WEATHER FETCH ----------------
def fetch_weather_data():
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return None

    city = "kovilpatti"
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        temperature = round(data['main']['temp'])   # 🔑 ROUND HERE
        humidity = data['main']['humidity']
        weather_description = data['weather'][0]['description'].title()

        return {
            "temperature": temperature,
            "humidity": humidity,
            "airQuality": weather_description,
            "status": "SAFE" if temperature < 35 else "WARNING"
        }
    except:
        return None

# ---------------- CURRENT ENVIRONMENT ----------------
@env_bp.route("/environment", methods=["GET"])
@cross_origin()
def get_environment():
    real_data = fetch_weather_data()
    now_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if real_data:
        record = {
            **real_data,
            "lastUpdated": now_time,
            "timestamp": datetime.now()
        }

        # keep only latest
        env_col.delete_many({})
        env_col.insert_one(record)

        # ✅ SAVE HISTORY ONLY IF TEMPERATURE CHANGED
        last = get_last_today_record()
        if last is None or last.get("temperature") != record["temperature"]:
            env_history_col.insert_one(record)

        return jsonify({
            **real_data,
            "lastUpdated": now_time,
            "hasData": True
        })

    # fallback
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

    data["lastUpdated"] = now_time
    data["airQuality"] = data.get("airQuality", "NORMAL AIR")

    return jsonify({
        "status": data.get("status", "SAFE"),
        "temperature": data.get("temperature", 0),
        "humidity": data.get("humidity", 0),
        "airQuality": data.get("airQuality"),
        "lastUpdated": data["lastUpdated"],
        "hasData": True
    })

# ---------------- LAST 24 HOURS ----------------
@env_bp.route("/environment/history/24h", methods=["GET"])
@cross_origin()
def get_environment_history():
    since = datetime.now() - timedelta(hours=24)
    history = list(env_history_col.find(
        {"timestamp": {"$gte": since}},
        {"_id": 0}
    ))
    return jsonify(history)

# ---------------- DAILY HISTORY ----------------
@env_bp.route("/environment/history/today", methods=["GET"])
@cross_origin()
def get_environment_daily_history():
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    history = list(env_history_col.find(
        {"timestamp": {"$gte": today_start}},
        {"_id": 0}
    ).sort("timestamp", 1))

    for h in history:
        h["timestamp"] = h["timestamp"].isoformat()

    return jsonify(history)

# ---------------- WEEKLY HISTORY ----------------
@env_bp.route("/environment/history/7days", methods=["GET"])
@cross_origin()
def get_environment_weekly_history():
    now = datetime.now()
    days_since_sunday = (now.weekday() - 6) % 7
    sunday = now - timedelta(days=days_since_sunday)
    sunday_start = sunday.replace(hour=0, minute=0, second=0, microsecond=0)

    history = list(env_history_col.find(
        {"timestamp": {"$gte": sunday_start}},
        {"_id": 0}
    ))

    daily = defaultdict(list)
    for r in history:
        daily[r["timestamp"].date()].append(r["temperature"])

    result = []
    for i in range(7):
        day = sunday_start + timedelta(days=i)
        temps = daily.get(day.date(), [])
        avg = sum(temps) / len(temps) if temps else 0
        result.append({
            "timestamp": day.isoformat(),
            "temperature": round(avg, 2)
        })

    return jsonify(result)
