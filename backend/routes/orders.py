from flask import Blueprint, request, jsonify
from datetime import datetime
from db import order_col
from bson import ObjectId

orders_bp = Blueprint("orders", __name__)

# 🔹 AUTO INCREMENT ORDER NUMBER
def get_next_order_no():
    last_order = order_col.find_one({}, sort=[("orderNo", -1)])
    if last_order and "orderNo" in last_order:
        return last_order["orderNo"] + 1
    else:
        return 1


# ================================
# USER → PLACE ORDER
# ================================
@orders_bp.route("/orders", methods=["POST", "OPTIONS"])
def create_order():
    if request.method == "OPTIONS":
        # Handle preflight request
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 200

    data = request.json

    order = {
        "orderNo": get_next_order_no(),  # ✅ NEW
        "customerName": data["customerName"],
        "phone": data["phone"],
        "product": data["product"],
        "quantity": data["quantity"],
        "status": "PENDING",
        "createdAt": datetime.now()
    }

    order_col.insert_one(order)
    return jsonify({"message": "Order placed successfully"}), 201


# ================================
# ADMIN → VIEW ALL ORDERS
# ================================
@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    orders = list(order_col.find({}))
    for o in orders:
        o["_id"] = str(o["_id"])
    return jsonify(orders)


# ================================
# ADMIN → UPDATE STATUS
# ================================
@orders_bp.route("/orders/status", methods=["PUT"])
def update_status():
    data = request.json

    result = order_col.update_one(
        {"_id": ObjectId(data["orderId"])},  # ✅ FIXED
        {"$set": {"status": data["status"]}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404

    return jsonify({"message": "Order status updated"})


# ================================
# USER → TRACK ORDERS BY PHONE
# ================================
@orders_bp.route("/orders/track/<phone>", methods=["GET"])
def track_orders(phone):
    orders = list(order_col.find(
        {"phone": str(phone)},
        {"_id": 0}
    ))
    return jsonify(orders)


# ================================
# DASHBOARD → ORDER STATISTICS
# ================================
@orders_bp.route("/orders/stats", methods=["GET"])
def get_order_stats():
    pipeline = [
        {"$group": {"_id": "$product", "count": {"$sum": 1}}}
    ]
    stats = list(order_col.aggregate(pipeline))

    # Convert to format suitable for pie chart
    result = []
    for stat in stats:
        result.append({
            "product": stat["_id"],
            "count": stat["count"]
        })

    return jsonify(result)
