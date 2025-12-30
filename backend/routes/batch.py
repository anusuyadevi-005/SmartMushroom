from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from db import batch_col

batch_bp = Blueprint("batch", __name__)

@batch_bp.route("/batch", methods=["POST"])
def create_batch():
    data = request.json

    start_date = datetime.strptime(data["startDate"], "%Y-%m-%d")
    expiry_date = start_date + timedelta(days=2)

    batch = {
        "batchId": data["batchId"],
        "startDate": data["startDate"],
        "expiryDate": expiry_date.strftime("%Y-%m-%d"),
        "status": "SAFE",
        "createdAt": datetime.now()
    }

    batch_col.insert_one(batch)

    return jsonify({
        "message": "Batch created successfully",
        "expiryDate": batch["expiryDate"]
    })
