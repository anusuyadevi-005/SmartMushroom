from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from db import batch_col

expiry_bp = Blueprint("expiry", __name__)

@expiry_bp.route("/expiry", methods=["GET"])
def check_expiry():
    now = datetime.now()

    batches = list(batch_col.find({}, {"_id": 0}))

    expired = []
    expiring_soon = []

    for b in batches:
        start = datetime.strptime(b["startDate"], "%Y-%m-%d")
        expiry_date = start + timedelta(days=2)

        if now > expiry_date:
            expired.append(b)
        elif expiry_date - now <= timedelta(hours=36):
            expiring_soon.append(b)

    return jsonify({
        "expired": expired,
        "expiringSoon": expiring_soon
    })
