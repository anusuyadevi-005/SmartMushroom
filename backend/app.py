print("🔥 THIS APP.PY IS RUNNING 🔥")

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from db import batch_col
from routes.expiry import expiry_bp
from routes.environment import env_bp
from routes.orders import orders_bp
from routes.dashboard import dashboard_bp
from routes.auth import google_login, google_callback


app = Flask(__name__)
CORS(app)

# register blueprints
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(dashboard_bp)
app.add_url_rule("/login/google", view_func=google_login)
app.add_url_rule("/login/google/callback", view_func=google_callback)


@app.route("/")
def home():
    return jsonify({
        "status": "AgroSense Backend Running Successfully"
    })

# CREATE BATCH
@app.route("/batch", methods=["POST"])
def create_batch():
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    batch = {
        "batchId": data["batchId"],
        "startDate": data["startDate"],
        "createdAt": datetime.now(),
        "status": "ACTIVE"
    }

    batch_col.insert_one(batch)

    return jsonify({
        "message": "Cultivation batch created successfully"
    }), 201

# GET BATCHES
@app.route("/batch", methods=["GET"])
def get_batches():
    batches = list(batch_col.find({}, {"_id": 0}))
    return jsonify(batches), 200

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)

