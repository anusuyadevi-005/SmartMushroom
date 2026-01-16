from flask import Blueprint, jsonify
from db import batch_col, order_col
from datetime import datetime, timedelta

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    now = datetime.now()

    total_orders = order_col.count_documents({})

    active_batches = 0
    expired_batches = 0
    expiring_soon = 0

    batches = list(batch_col.find({}, {"_id": 0, "startDate": 1}))

    for b in batches:
        start_str = b.get("startDate")
        if not start_str:
            continue

        try:
            start_date = datetime.strptime(start_str, "%Y-%m-%d")
        except Exception:
            continue

        expiry_date = start_date + timedelta(days=2)

        if now > expiry_date:
            expired_batches += 1
        else:
            active_batches += 1

            # expiring within next 36 hours
            if expiry_date - now <= timedelta(hours=36):
                expiring_soon += 1

    return jsonify({
        "activeBatches": active_batches,
        "expiredBatches": expired_batches,
        "expiringSoon": expiring_soon,
        "totalOrders": total_orders
    })
