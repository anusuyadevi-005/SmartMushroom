print("🔥 THIS APP.PY IS RUNNING 🔥")
from routes.expiry import expiry_bp
from routes.environment import env_bp
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from db import batch_col

app = Flask(__name__)
CORS(app)
app.register_blueprint(env_bp)
app.register_blueprint(expiry_bp)

@app.route("/")
def home():
    return jsonify({
        "status": "AgroSense Backend Running Successfully"
    })

# STEP 1 FEATURE: Create cultivation batch
@app.route("/batch", methods=["POST"])
def create_batch():
    data = request.json

    # real data from admin
    batch = {
        "batchId": data["batchId"],
        "startDate": data["startDate"],
        "createdAt": datetime.now(),
        "status": "ACTIVE"
    }

    batch_col.insert_one(batch)

    return jsonify({
        "message": "Cultivation batch created successfully"
    })

if __name__ == "__main__":
    app.run(debug=True)
