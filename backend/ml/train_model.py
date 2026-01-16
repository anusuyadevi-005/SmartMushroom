import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib

# ---------------- LOAD DATASET ----------------
df = pd.read_csv("ml/data/oyster_mushroom_realtime_dataset.csv")

# Features
X = df[["temperature", "humidity", "air_quality", "batch_age"]]

# Targets
y_day = df["yield_day"]
y_kg = df["yield_kg"]

# ---------------- SPLIT DATA ----------------
X_train, X_test, y_day_train, y_day_test = train_test_split(
    X, y_day, test_size=0.2, random_state=42
)

_, _, y_kg_train, y_kg_test = train_test_split(
    X, y_kg, test_size=0.2, random_state=42
)

# ---------------- TRAIN MODELS ----------------
day_model = RandomForestRegressor(n_estimators=100, random_state=42)
kg_model = RandomForestRegressor(n_estimators=100, random_state=42)

day_model.fit(X_train, y_day_train)
kg_model.fit(X_train, y_kg_train)

# ---------------- SAVE MODELS ----------------
joblib.dump(day_model, "yield_day_model.pkl")
joblib.dump(kg_model, "yield_kg_model.pkl")

print("✅ ML models trained successfully!")
print("📦 Files created:")
print(" - yield_day_model.pkl")
print(" - yield_kg_model.pkl")
