from pymongo import MongoClient
import sys

MONGO_URI = "mongodb+srv://anusuyapadmavathi2020_db_user:Anu006@cluster0.bcfbhio.mongodb.net/agrosense_db?retryWrites=true&w=majority"

print(f"Attempting to connect to: {MONGO_URI.split('@')[-1]}")
try:
    client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    db = client["agrosense_db"]
    # Verify connection by listing collections
    collections = db.list_collection_names()
    print("Successfully connected to MongoDB!")
    print(f"Available collections: {collections}")
    
    order_col = db["orders"]
    count = order_col.count_documents({})
    print(f"Number of orders in database: {count}")
    
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    sys.exit(1)
