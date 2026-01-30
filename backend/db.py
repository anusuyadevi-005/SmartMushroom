from pymongo import MongoClient

MONGO_URI = "mongodb+srv://anusuyapadmavathi2020_db_user:Anu006@cluster0.bcfbhio.mongodb.net/agrosense_db?retryWrites=true&w=majority&tlsCertificateKeyFilePassword="

try:
    client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
    db = client["agrosense_db"]
    # Existing collections
    batch_col = db["batches"]
    env_col = db["environment_logs"]
    order_col = db["orders"]
    admin_col = db["admins"]
    users_col = db["users"]
    env_history_col = db["environment_history"]
    product_col = db["products"]
    dish_col = db["dishes"]
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    client = None
    db = None
    batch_col = None
    env_col = None
    order_col = None
    admin_col = None
    users_col = None
    env_history_col = None
    product_col = None
