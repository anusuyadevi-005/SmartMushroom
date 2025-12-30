from flask import Blueprint, jsonify
from db import batch_col, order_col
from datetime import datetime, timedelta

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    """Return dashboard summary where active batches exclude those
    that are already expired (more than 2 days after startDate)."""
    now = datetime.now()

    total_batches = batch_col.count_documents({})
    total_orders = order_col.count_documents({})

    # compute active and expired using the same 2-day rule as /expiry
    active_batches = 0
    expired_count = 0
    expiring_soon_count = 0

    batches = list(batch_col.find({}, {"_id": 0, "startDate": 1, "status": 1}))
    for b in batches:
        start_str = b.get("startDate")
        status = b.get("status")
        if not start_str:
            # if no startDate, conservatively treat based on status
            if status == "ACTIVE":
                active_batches += 1
            continue

        try:
            start = datetime.strptime(start_str, "%Y-%m-%d")
        except Exception:
            # malformed date -> skip counting as active
            continue

        expiry_date = start + timedelta(days=2)

        if now > expiry_date:
            expired_count += 1
        else:
            # within expiry window
            # mark as expiring soon if within 36 hours
            if expiry_date - now <= timedelta(hours=36):
                expiring_soon_count += 1

            # count as active only when status is ACTIVE
            if status == "ACTIVE":
                active_batches += 1

    return jsonify({
        "totalBatches": total_batches,
        "activeBatches": active_batches,
        "totalOrders": total_orders,
        "expiredBatches": expired_count,
        "expiringSoon": expiring_soon_count
    })
