import joblib
import pandas as pd
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load both trained models
yield_kg_model = joblib.load(os.path.join(BASE_DIR, "yield_kg_model.pkl"))
yield_day_model = joblib.load(os.path.join(BASE_DIR, "yield_day_model.pkl"))

def predict_yield(temp, humidity, air_quality, batch_age):
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
