from pymongo import MongoClient

MONGO_URI = "mongodb+srv://anusuyapadmavathi2020_db_user:Anu006@cluster0.bcfbhio.mongodb.net/agrosense_db?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)

db = client["agrosense_db"]

# Existing collections
batch_col = db["batches"]
env_col = db["environment_logs"]
order_col = db["orders"]
admin_col = db["admins"]
users_col = db["users"]
env_history_col = db["environment_history"]
