import os
from dotenv import load_dotenv

load_dotenv()

key_id = os.environ.get("RAZORPAY_KEY_ID")
key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

print(f"Key ID: {key_id}")
# print(f"Key Secret: {key_secret[:4]}****") # for security

if not key_id or not key_secret:
    print("❌ KEYS NOT FOUND IN .ENV")
else:
    print("✅ KEYS LOADED FROM .ENV")
