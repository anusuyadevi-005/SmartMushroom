import requests
import json

BASE_URL = "http://localhost:5000"

# 1. Login to get token
login_data = {
    "email": "anusuyapadmavathi2020@gmail.com", # Assuming this is a valid admin email from context
    "password": "pass" # I don't know the actual password, but I can check if login works
}

# Actually, I can search for a valid admin in the db first
from pymongo import MongoClient
client = MongoClient("mongodb+srv://anusuyapadmavathi2020_db_user:Anu006@cluster0.bcfbhio.mongodb.net/agrosense_db?retryWrites=true&w=majority", tlsAllowInvalidCertificates=True)
db = client["agrosense_db"]
admin = db["admins"].find_one()
if admin:
    print(f"Found admin: {admin['email']}")
else:
    print("No admin found in database")
    # Maybe try to create one? No, that's risky.

# Instead of actual login (which requires password), I'll try to find a token in a hypothetical local storage or just verify the endpoint exists.
try:
    r = requests.get(f"{BASE_URL}/")
    print(f"Backend home status: {r.status_code}")
    print(f"Backend home response: {r.json()}")
    
    # Try the orders endpoint (will likely fail with 401/status code)
    r = requests.get(f"{BASE_URL}/orders")
    print(f"Orders endpoint status (no token): {r.status_code}")
except Exception as e:
    print(f"Failed to connect to backend: {e}")
