from flask import Blueprint, request, jsonify
from datetime import datetime
from db import env_col

env_bp = Blueprint("env", __name__)

@env_bp.route("/environment", methods=["POST"])
def log_environment():
    data = request.json

    record = {
        "batchId": data["batchId"],
        "temperature": data["temperature"],
        "humidity": data["humidity"],
        "createdAt": datetime.now()
    }

    env_col.insert_one(record)

    return jsonify({
        "message": "Environment data saved successfully"
    })
