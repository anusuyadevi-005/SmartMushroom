import joblib
import pandas as pd
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load both trained models with error handling
models_loaded = False
try:
    yield_kg_model = joblib.load(os.path.join(BASE_DIR, "yield_kg_model.pkl"))
    yield_day_model = joblib.load(os.path.join(BASE_DIR, "yield_day_model.pkl"))
    models_loaded = True
    print("✅ ML models loaded successfully")
except Exception as e:
    print(f"⚠️  Could not load ML models: {e}")
    print("🔄 Using fallback prediction logic")
    yield_kg_model = None
    yield_day_model = None

def predict_yield(temp, humidity, air_quality, batch_age):
    # If models are not loaded, return fallback predictions
    if not models_loaded:
        # Fallback predictions based on typical mushroom growth patterns
        base_yield = 2.5  # kg
        base_days = 25   # days

        # Adjust based on conditions (simplified logic)
        if temp >= 20 and temp <= 28:  # Optimal temperature range
            yield_multiplier = 1.2
        elif temp >= 15 and temp <= 32:  # Acceptable range
            yield_multiplier = 1.0
        else:
            yield_multiplier = 0.8

        if humidity >= 80 and humidity <= 95:  # Optimal humidity
            yield_multiplier *= 1.1
        elif humidity >= 70 and humidity <= 99:  # Acceptable range
            yield_multiplier *= 1.0
        else:
            yield_multiplier *= 0.9

        # Adjust harvest time based on temperature
        if temp >= 22 and temp <= 26:
            day_adjustment = -2  # Faster growth in optimal temp
        elif temp >= 18 and temp <= 30:
            day_adjustment = 0
        else:
            day_adjustment = 3  # Slower growth outside optimal range

        predicted_kg = base_yield * yield_multiplier
        predicted_day = base_days + day_adjustment

        return {
            "expected_yield_kg": round(float(predicted_kg), 2),
            "expected_harvest_day": int(predicted_day),
            "note": "Using fallback predictions - ML models not available"
        }

    # Convert air_quality string to numeric value
    if isinstance(air_quality, str):
        # Map weather descriptions to numeric values based on dataset
        air_quality_map = {
            "CLEAR SKY": 1,
            "FEW CLOUDS": 1,
            "SCATTERED CLOUDS": 1,
            "BROKEN CLOUDS": 2,
            "OVERCAST CLOUDS": 2,
            "LIGHT RAIN": 2,
            "MODERATE RAIN": 2,
            "NORMAL AIR": 1,  # Default good air quality
            "UNKNOWN": 1
        }
        air_quality = air_quality_map.get(air_quality.upper(), 1)  # Default to 1 if not found

    data = pd.DataFrame([{
        "temperature": temp,
        "humidity": humidity,
        "air_quality": air_quality,
        "batch_age": batch_age
    }])

    predicted_kg = yield_kg_model.predict(data)[0]
    predicted_day = yield_day_model.predict(data)[0]

    return {
        "expected_yield_kg": round(float(predicted_kg), 2),
        "expected_harvest_day": int(predicted_day)
    }
